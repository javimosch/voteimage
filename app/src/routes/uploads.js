const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..','..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const { readNamespaceData, writeNamespaceData } = require('../utils/dataHelpers');

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const namespaceId = req.query.namespace;
    if (!namespaceId) {
      return cb(new Error('Namespace ID is required for upload'), null);
    }
    const namespaceUploadDir = path.join(UPLOADS_DIR, namespaceId);
    try {
      await fs.mkdir(namespaceUploadDir, { recursive: true });
      cb(null, namespaceUploadDir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|svg/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};

const MAX_FILES_UPLOAD = 10;
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).array('logoFiles', MAX_FILES_UPLOAD);

// POST /upload endpoint
router.post('/', (req, res) => {
  upload(req, res, async (err) => {
    const { namespace } = req.query;

    if (!namespace) {
      if (req.files && req.files.length > 0) {
        console.log('Namespace missing, cleaning up uploaded files...');
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(console.error)));
      }
      return res.status(400).json({ message: 'Namespace ID is required.' });
    }

    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Unknown upload error:', err);
      if (err.message.startsWith('Error: File upload only supports')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: `Upload error: ${err.message}` });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded or invalid file types.' });
    }

    let data;
    try {
      data = await readNamespaceData(namespace);
      if (!data) {
        console.log(`Namespace ${namespace} not found, cleaning up uploaded files...`);
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(console.error)));
        return res.status(404).json({ message: 'Namespace not found.' });
      }
    } catch (readError) {
      console.error(`Error reading namespace ${namespace} before processing uploads:`, readError);
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(console.error)));
      return res.status(500).json({ message: 'Failed to read namespace data.' });
    }

    const uploadedLogos = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const logoId = uuidv4();
        const relativePath = path.join(namespace, file.filename);

        const newLogo = {
          id: logoId,
          path: relativePath,
          votes: [],
          description: ""
        };

        data.logos.push(newLogo);
        uploadedLogos.push({
          originalName: file.originalname,
          logoId: logoId,
          path: `/data/uploads/${relativePath}`
        });
        console.log(`Logo ${logoId} (${file.originalname}) staged for namespace ${namespace}`);
      } catch (processingError) {
        console.error(`Error processing file ${file.originalname}:`, processingError);
        errors.push({ originalName: file.originalname, message: 'Failed to process file data.' });
        await fs.unlink(file.path).catch(console.error);
      }
    }

    try {
      if (uploadedLogos.length > 0) {
        await writeNamespaceData(namespace, data);
        console.log(`Successfully processed and saved ${uploadedLogos.length} logos for namespace ${namespace}.`);
      } else {
        console.log(`No logos successfully processed for namespace ${namespace}.`);
      }

      if (errors.length === 0) {
        res.status(201).json({
          message: `${uploadedLogos.length} file(s) uploaded successfully.`,
          uploadedLogos: uploadedLogos
        });
      } else if (uploadedLogos.length > 0) {
        res.status(207).json({
          message: `Processed ${req.files.length} files. ${uploadedLogos.length} succeeded, ${errors.length} failed.`,
          uploadedLogos: uploadedLogos,
          errors: errors
        });
      } else {
        res.status(500).json({
          message: `All ${errors.length} files failed during processing.`,
          errors: errors
        });
      }
    } catch (writeError) {
      console.error(`Error writing namespace data for ${namespace} after processing uploads:`, writeError);
      res.status(500).json({ message: 'Failed to save uploaded file data. Server error.' });
    }
  });
});

module.exports = router;
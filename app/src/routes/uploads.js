const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const FileService = require('../services/FileService');

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
        await FileService.cleanupFiles(req.files);
      }
      return res.status(400).json({ message: 'Namespace ID is required.' });
    }

    if (err) {
      console.error(`Error during upload for namespace ${namespace}:`, err);
      const errorResponse = FileService.handleUploadError(err);
      return res.status(errorResponse.status).json({ message: errorResponse.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded or invalid file types.' });
    }

    try {
      await FileService.validateNamespace(namespace);
    } catch (error) {
      console.error(`Error validating namespace ${namespace}:`, error);
      await FileService.cleanupFiles(req.files);
      return res.status(404).json({ message: 'Namespace not found.' });
    }

    try {
      console.log(`Processing upload of ${req.files.length} files for namespace ${namespace}`);
      const { uploadedLogos, errors } = await FileService.processUpload(req.files, namespace);
      
      console.log(`Processed ${req.files.length} files for namespace ${namespace}: ${uploadedLogos.length} succeeded, ${errors.length} failed.`,{
        uploadedLogos,
        errors
      });

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
    } catch (error) {
      console.error(`Error processing upload for namespace ${namespace}:`, error);
      res.status(500).json({ message: 'Failed to process upload. Server error.' });
    }
  });
});

module.exports = router;
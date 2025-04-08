const fs = require('fs').promises;
const path = require('path');
const { readNamespaceData, writeNamespaceData } = require('../utils/dataHelpers');
const { UPLOADS_DIR } = require('../config');
const { v4: uuidv4 } = require('uuid');

class FileService {
  static async processUpload(files, namespace) {
    const uploadedLogos = [];
    const errors = [];

    for (const file of files) {
      try {
        const logoId = uuidv4();
        const relativePath = path.join(namespace, file.filename);

        const newLogo = {
          id: logoId,
          path: relativePath,
          votes: [],
          description: ""
        };

        const data = await readNamespaceData(namespace);
        data.logos.push(newLogo);
        await writeNamespaceData(namespace, data);

        uploadedLogos.push({
          originalName: file.originalname,
          logoId: logoId,
          path: `/data/uploads/${relativePath}`
        });
      } catch (error) {
        errors.push({ originalName: file.originalname, message: error.message });
        await fs.unlink(file.path).catch(console.error);
      }
    }

    return { uploadedLogos, errors };
  }

  static async validateNamespace(namespace) {
    try {
      const data = await readNamespaceData(namespace);
      if (!data) {
        throw new Error('Namespace not found');
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async cleanupFiles(files) {
    await Promise.all(files.map(file => fs.unlink(file.path).catch(console.error)));
  }

  static handleUploadError(error) {
    if (error instanceof multer.MulterError) {
      return { status: 400, message: `Upload error: ${error.message}` };
    } else if (error.message.startsWith('Error: File upload only supports')) {
      return { status: 400, message: error.message };
    }
    return { status: 500, message: `Upload error: ${error.message}` };
  }
}

module.exports = FileService;
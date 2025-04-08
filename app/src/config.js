const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const NAMESPACES_DIR = path.join(DATA_DIR, 'namespaces');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

module.exports = {
    DATA_DIR,
    NAMESPACES_DIR,
    UPLOADS_DIR
};
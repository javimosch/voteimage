const fs = require('fs').promises;
const path = require('path');
const DATA_DIR = path.join(__dirname, '..','..', 'data');

const NAMESPACES_DIR = path.join(DATA_DIR, 'namespaces');

const getNamespaceFilePath = (namespaceId) => path.join(NAMESPACES_DIR, `${namespaceId}.json`);

// Read namespace data
async function readNamespaceData(namespaceId) {
    const filePath = getNamespaceFilePath(namespaceId);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null; // Namespace file doesn't exist
        }
        console.error(`Error reading namespace ${namespaceId}:`, error);
        throw new Error('Could not read namespace data.');
    }
}

// Write namespace data
async function writeNamespaceData(namespaceId, data) {
    const filePath = getNamespaceFilePath(namespaceId);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing namespace ${namespaceId}:`, error);
        throw new Error('Could not write namespace data.');
    }
}

module.exports = {
    readNamespaceData,
    writeNamespaceData,
    getNamespaceFilePath
};
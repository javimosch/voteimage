const fs = require('fs').promises;
const path = require('path');

/**
 * Reads files from a directory, optionally orders them based on an order.json file,
 * and concatenates their content. HTML files are concatenated directly, JS files
 * are wrapped in <script> tags before concatenation.
 *
 * @param {string} dirPath Absolute path to the directory containing the files.
 * @returns {Promise<string>} A promise that resolves with the concatenated content as a string.
 * @throws {Error} If the directory doesn't exist or other file system errors occur.
 */
async function compileVirtualFile(dirPath) {
    let files;
    try {
        files = await fs.readdir(dirPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error(`Virtual file directory not found: ${dirPath}`);
        }
        throw err; // Re-throw other errors
    }

    const orderFilePath = path.join(dirPath, 'order.json');
    let orderedFiles = [];
    let orderExists = false;

    try {
        const orderContent = await fs.readFile(orderFilePath, 'utf-8');
        orderedFiles = JSON.parse(orderContent);
        orderExists = true;
        // Validate that all files in order.json actually exist
        const missingFiles = orderedFiles.filter(f => !files.includes(f));
        if (missingFiles.length > 0) {
            console.warn(`WARN: order.json in ${dirPath} lists files that don't exist: ${missingFiles.join(', ')}`);
            // Filter out missing files from the order
            orderedFiles = orderedFiles.filter(f => files.includes(f));
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            // order.json doesn't exist, use default ordering
            console.log(`No order.json found in ${dirPath}, using default order.`);
        } else {
            console.error(`Error reading or parsing order.json in ${dirPath}:`, err);
            // Proceed with default order in case of error
        }
        orderExists = false;
    }

    let filesToProcess = [];
    if (orderExists) {
        filesToProcess = orderedFiles;
        // Add any files not mentioned in order.json according to default rules
        const remainingFiles = files.filter(f => f !== 'order.json' && !orderedFiles.includes(f));
        remainingFiles.sort(); // Alphabetical sort for remaining
        filesToProcess.push(...remainingFiles);
    } else {
        // Default ordering: top.html first, bottom.html last, others alphabetical
        // Separate JS and HTML files
        const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'top.html' && f !== 'bottom.html').sort();
        const jsFiles = files.filter(f => f.endsWith('.js')).sort();

        if (files.includes('top.html')) {
            filesToProcess.push('top.html');
        }
        filesToProcess.push(...htmlFiles);
        if (files.includes('bottom.html')) {
            filesToProcess.push('bottom.html');
        }
        // JS files are typically added before the closing body tag,
        // so we'll handle them separately during concatenation.
        // For now, just list them. If bottom.html exists, they go before it conceptually.
        // If bottom.html doesn't exist, they just go at the end.
    }

    // Filter out order.json itself if it ended up in the list somehow
    filesToProcess = filesToProcess.filter(f => f !== 'order.json');

    // Read and concatenate content
    let finalContent = '';
    for (const file of filesToProcess) {
        const filePath = path.join(dirPath, file);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (file.endsWith('.js')) {
                // Wrap JS content in script tags
                // Ensure script tags are not nested if content already has them (unlikely but safe)
                if (!content.trim().startsWith('<script') && !content.trim().endsWith('</script>')) {
                     finalContent += `<script>\n${content}\n</script>\n`;
                } else {
                     finalContent += content + '\n'; // Assume it's already correctly wrapped
                }
            } else {
                // Append HTML/CSS/other content directly
                finalContent += content + '\n';
            }
        } catch (readErr) {
            console.error(`Error reading file ${filePath}:`, readErr);
            finalContent += `<!-- Error reading file: ${file} -->\n`;
        }
    }

    // Append JS files if default order was used and bottom.html existed
    // (The logic above already placed them if order.json was used, or if bottom.html didn't exist)
    // Re-evaluation: The knowledge file says JS files are appended at the end of <body>.
    // Let's adjust: Always append JS files (wrapped) at the very end unless specified otherwise in order.json.

    let finalContentWithScripts = '';
    let scriptContent = '';
    const jsFilesToAppend = files.filter(f => f.endsWith('.js') && !orderedFiles.includes(f)).sort(); // Get JS files not in order.json

     if (!orderExists || jsFilesToAppend.length > 0) {
         for (const file of jsFilesToAppend) {
             const filePath = path.join(dirPath, file);
             try {
                 const content = await fs.readFile(filePath, 'utf-8');
                 if (!content.trim().startsWith('<script') && !content.trim().endsWith('</script>')) {
                     scriptContent += `<script>\n${content}\n</script>\n`;
                 } else {
                     scriptContent += content + '\n';
                 }
             } catch (readErr) {
                 console.error(`Error reading JS file ${filePath}:`, readErr);
                 scriptContent += `<!-- Error reading JS file: ${file} -->\n`;
             }
         }
     }

    // Rebuild final content inserting scripts before </body> if possible
    const bodyEndTagIndex = finalContent.lastIndexOf('</body>');
    if (bodyEndTagIndex !== -1) {
        finalContentWithScripts = finalContent.substring(0, bodyEndTagIndex) + scriptContent + finalContent.substring(bodyEndTagIndex);
    } else {
        // If no </body> tag, just append scripts at the end
        finalContentWithScripts = finalContent + scriptContent;
    }


    return finalContentWithScripts;
}

module.exports = {
    compileVirtualFile
};
const cloudinary = require('../config/cloudinary')
const streamifier = require('streamifier');

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - The file buffer from Multer (req.file.buffer)
 * @param {string} folder - The destination folder in Cloudinary
 */
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "auto" }, // resource_type: "auto" handles both images and PDFs
            (error, result) => {
                if (result) {
                    resolve({ url: result.secure_url, publicId: result.public_id });
                } else {
                    reject(error);
                }
            }
        );
        // Write the buffer to the stream
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

module.exports = { uploadToCloudinary };
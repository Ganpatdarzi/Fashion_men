const cloudinary = require("cloudinary").v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      folder: options.folder || "fashion-men",
      resource_type: options.resourceType || "auto",
      public_id: options.publicId,
      overwrite: options.overwrite !== false,
    };
    if (process.env.CLOUDINARY_UPLOAD_PRESET) {
      opts.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET;
      opts.unsigned = true;
      delete opts.overwrite;
    }
    cloudinary.uploader
      .upload_stream(opts, (err, result) => (err ? reject(err) : resolve(result)))
      .end(buffer);
  });
}

function destroy(publicId, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: options.resourceType || "image" }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });
}

module.exports = { cloudinary, uploadBuffer, destroy };
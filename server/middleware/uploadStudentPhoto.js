'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const PHOTO_DIR = path.join(__dirname, '..', '..', 'storage', 'student-photos');
const MAX_SIZE = 3 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Only JPG, JPEG, PNG, and WebP images are allowed.');
      error.statusCode = 422;
      return callback(error);
    }
    return callback(null, true);
  }
});

function hasValidSignature(buffer, mimetype) {
  if (mimetype === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}

function uploadStudentPhoto(req, res, next) {
  upload.single('profile_photo')(req, res, async (error) => {
    if (error) return next(error);
    if (!req.file) return next();
    if (!hasValidSignature(req.file.buffer, req.file.mimetype)) {
      return res.status(422).json({ success: false, message: 'The uploaded file is not a valid JPG, PNG, or WebP image.', errors: [] });
    }
    const filename = `${crypto.randomUUID()}.${req.file.mimetype === 'image/jpeg' ? 'jpg' : req.file.mimetype.slice(6)}`;
    const relativePath = `storage/student-photos/${filename}`;
    try {
      await fs.mkdir(PHOTO_DIR, { recursive: true });
      await fs.writeFile(path.join(PHOTO_DIR, filename), req.file.buffer, { flag: 'wx' });
      req.uploadedPhotoPath = relativePath;
      return next();
    } catch (writeError) {
      return next(writeError);
    }
  });
}

module.exports = { uploadStudentPhoto, PHOTO_DIR };

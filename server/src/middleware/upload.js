const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE_MB = 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PHOTO_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

// Wraps multer's single-file middleware so upload errors come back in the
// standard { error: { code, message } } shape instead of falling through to
// the generic 500 handler.
function uploadPhoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `photo must be under ${MAX_PHOTO_SIZE_MB}MB` },
      });
    }
    if (err.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'photo must be a JPEG, PNG, or WebP image' },
      });
    }
    return next(err);
  });
}

module.exports = { uploadPhoto, UPLOADS_DIR };

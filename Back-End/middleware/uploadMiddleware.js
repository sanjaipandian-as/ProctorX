const multer = require("multer");
const path = require('path');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary")



const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) cb(null, true);
  else cb(new Error("Only images are allowed (jpeg, jpg, png)"));
};

const getUpload = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `proctorx/${folder}`, 
      allowed_formats: ["jpg", "jpeg", "png"],
      public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`,
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  });
};

module.exports = { getUpload };

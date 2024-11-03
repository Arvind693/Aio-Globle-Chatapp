const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // Set your cloud name
  api_key: process.env.CLOUDINARY_API_KEY,         // Set your API key
  api_secret: process.env.CLOUDINARY_API_SECRET    // Set your API secret
});


module.exports = cloudinary;

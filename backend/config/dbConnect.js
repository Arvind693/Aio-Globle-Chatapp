const mongoose = require('mongoose');
require('dotenv').config();

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.mongo_url, {
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Wait only 5 seconds for MongoDB server response
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB Connected Successfully 🥰");
    } catch (error) {
        console.log("Failed to connect the database 😥");
        process.exit(1);
    }
};

module.exports = dbConnect;
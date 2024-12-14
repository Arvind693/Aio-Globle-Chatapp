
const AutoResponse = require('../models/autoResponsesModel');

// Fetch all active auto-responses
const getAutoResponses = async (req, res) => {
    try {
      const autoResponses = await AutoResponse.find({ isActive: true }); // Fetch only active auto-responses
      res.status(200).json({
        success: true,
        data: autoResponses
      });
    } catch (error) {
      console.error("Error fetching auto-responses:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch auto-responses",
        error: error.message
      });
    }
  };

  module.exports = {getAutoResponses}
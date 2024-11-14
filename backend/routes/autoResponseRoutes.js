const express = require('express');
const { getAutoResponses } = require('../controllers/autoResponseController');
const router = express.Router();

router.get('/', getAutoResponses);

module.exports = router;
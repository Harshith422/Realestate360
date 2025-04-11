const express = require('express');
const router = express.Router();
const { predictMarketPrice } = require('../controllers/marketController');

// Market price prediction route
router.post('/predict-price', predictMarketPrice);

module.exports = router; 
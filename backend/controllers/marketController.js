const { predictPrice } = require('../services/pythonService');

const predictMarketPrice = async (req, res) => {
  try {
    const { city, sqft, bhk, propertyType } = req.body;

    console.log('Received prediction request:', { city, sqft, bhk, propertyType });

    // Validate input
    if (!city || !sqft || !bhk || !propertyType) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Convert sqft to number
    const size = parseFloat(sqft);
    if (isNaN(size) || size <= 0) {
      console.log('Invalid sqft value:', sqft);
      return res.status(400).json({ error: 'Invalid area value' });
    }

    // Convert bhk to number
    const no_of_bhk = parseInt(bhk);
    if (isNaN(no_of_bhk) || no_of_bhk <= 0) {
      console.log('Invalid bhk value:', bhk);
      return res.status(400).json({ error: 'Invalid BHK value' });
    }

    console.log('Calling Python service with:', { propertyType, size, city, no_of_bhk });
    
    // Call the Python service
    const result = await predictPrice(propertyType, size, city, no_of_bhk);
    
    console.log('Received prediction result:', result);
    res.json(result);
  } catch (error) {
    console.error('Detailed prediction error:', error);
    res.status(500).json({ 
      error: 'Error predicting price',
      details: error.message 
    });
  }
};

module.exports = {
  predictMarketPrice
}; 
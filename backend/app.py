from flask import Flask, request, jsonify
from flask_cors import CORS
from market import forecast_price, load_hpi_data
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize HPI data
logger.info("Initializing HPI data...")
load_hpi_data()
logger.info("HPI data initialized successfully")

@app.route('/api/market-trends', methods=['POST'])
def get_market_trends():
    try:
        logger.info("Received market trends request")
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        # Extract property details
        property_type = data.get('propertyType')
        size = data.get('area')
        city_name = data.get('city')
        no_of_bhk = data.get('bedrooms', 0)
        
        logger.debug(f"Extracted parameters - Type: {property_type}, Size: {size}, City: {city_name}, BHK: {no_of_bhk}")
        
        if not all([property_type, size, city_name]):
            missing = [k for k, v in {'propertyType': property_type, 'area': size, 'city': city_name}.items() if not v]
            logger.error(f"Missing required parameters: {missing}")
            return jsonify({'error': f'Missing required parameters: {missing}'}), 400
            
        # Get market predictions
        logger.info("Calling forecast_price...")
        prediction_result = forecast_price(
            property_type=property_type,
            size=float(size),
            city_name=city_name,
            no_of_bhk=int(no_of_bhk)
        )
        logger.info("Forecast completed successfully")
        logger.debug(f"Prediction result: {prediction_result}")
        
        # Return the prediction result directly
        return jsonify(prediction_result)
        
    except Exception as e:
        logger.error(f"Error in get_market_trends: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server...")
    app.run(debug=True) 
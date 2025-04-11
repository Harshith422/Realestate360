import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import mean_squared_error
import joblib
import os
import sys
import json

def log_error(message):
    print(f"Error: {message}", file=sys.stderr)
    sys.stderr.flush()

def log_info(message):
    print(f"Info: {message}", file=sys.stderr)
    sys.stderr.flush()

# Global variable to store HPI data
HPI_DATA = None
ALL_INDIA_RATE = None

# ==== LOAD & PREPROCESS DATA ====
def load_data(data_path):
    try:
        log_info(f"Attempting to load data from: {data_path}")
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Data file not found at {data_path}")
        
        df = pd.read_csv(data_path)
        log_info(f"Successfully loaded data with {len(df)} rows")
        return df
    except FileNotFoundError as e:
        log_error(f"Could not find data file: {str(e)}")
        sys.exit(1)
    except Exception as e:
        log_error(f"Error loading data: {str(e)}")
        sys.exit(1)

# ==== LOAD HPI DATA ====
def load_hpi_data():
    global HPI_DATA, ALL_INDIA_RATE
    try:
        # Get the directory where the script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        hpi_path = os.path.join(script_dir, 'EC-20240829-IN-01.csv')
        
        log_info(f"Loading HPI data from: {hpi_path}")
        log_info(f"Current working directory: {os.getcwd()}")
        
        if not os.path.exists(hpi_path):
            raise FileNotFoundError(f"HPI data file not found at {hpi_path}")
        
        hpi_df = pd.read_csv(hpi_path)
        log_info(f"Successfully loaded HPI data with {len(hpi_df)} rows")
        
        # Clean up the data
        hpi_df = hpi_df.dropna(axis=1, how='all')  # Remove empty columns
        
        # Get All India data from the first column after 'HPI'
        all_india_values = hpi_df['All India'].astype(float)
        all_india_growth = all_india_values.pct_change().mean()
        ALL_INDIA_RATE = all_india_growth
        
        # Process city data
        # Get all columns except 'HPI' and 'All India'
        city_columns = [col for col in hpi_df.columns if col not in ['HPI', 'All India']]
        
        # Create a dictionary to store city growth rates
        city_growth_rates = {}
        
        for city in city_columns:
            # Get the values for this city
            city_values = hpi_df[city].astype(float)
            # Calculate growth rate
            growth_rate = city_values.pct_change().mean()
            city_growth_rates[city] = growth_rate
        
        HPI_DATA = city_growth_rates
        log_info("HPI data processed successfully")
        log_info(f"All India growth rate: {ALL_INDIA_RATE:.4f}")
        log_info(f"Available cities: {list(HPI_DATA.keys())}")
        return True
    except FileNotFoundError as e:
        log_error(f"HPI data file not found: {str(e)}")
        return False
    except Exception as e:
        log_error(f"Error processing HPI data: {str(e)}")
        return False

# ==== GET GROWTH RATE ====
def get_growth_rate(city):
    global HPI_DATA, ALL_INDIA_RATE
    if HPI_DATA is None:
        if not load_hpi_data():
            return 0.02  # Default to 2% if HPI data loading fails
    
    # Try to get city-specific rate, fallback to All India rate
    city_rate = HPI_DATA.get(city)
    if city_rate is None or np.isnan(city_rate):
        log_info(f"Using All India growth rate for city: {city}")
        return ALL_INDIA_RATE if ALL_INDIA_RATE is not None else 0.02
    
    return city_rate

# ==== TRAIN AND SAVE MODEL ====
def train_and_save_model(data_path):
    try:
        # Load data
        df = load_data(data_path)
        
        # Load HPI data if not already loaded
        if HPI_DATA is None:
            if not load_hpi_data():
                raise Exception("Failed to load HPI data")
        
        # Ensure BHK = 0 for Residential Plot
        df.loc[df['Property_type'] == 'Residential Plot', 'No_of_BHK'] = 0

        # Define features and target
        X = df[['Size', 'No_of_BHK', 'City_name', 'Property_type']]
        y = df['Price']

        # Column transformer for categorical features
        categorical_features = ['City_name', 'Property_type']
        preprocessor = ColumnTransformer([
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ], remainder='passthrough')

        # ==== RANDOM FOREST PIPELINE ====
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])

        # Train-test split and fit
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        pipeline.fit(X_train, y_train)

        # Evaluate
        preds = pipeline.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        log_info(f"Model trained. RMSE: Rs.{rmse:.2f}")

        # ==== KNN MODEL TRAINING ====
        X_knn = df[['Size', 'No_of_BHK']].copy()
        X_knn['City_name'] = df['City_name']
        X_knn['Property_type'] = df['Property_type']
        X_knn_encoded = pd.get_dummies(X_knn)

        knn_model = NearestNeighbors(n_neighbors=5)
        knn_model.fit(X_knn_encoded)

        # Save models and data
        model_dir = 'models'
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)

        joblib.dump(pipeline, os.path.join(model_dir, 'price_pipeline.pkl'))
        joblib.dump(knn_model, os.path.join(model_dir, 'knn_model.pkl'))
        joblib.dump(X_knn_encoded, os.path.join(model_dir, 'knn_data.pkl'))
        joblib.dump(HPI_DATA, os.path.join(model_dir, 'city_growth_rates.pkl'))
        joblib.dump(ALL_INDIA_RATE, os.path.join(model_dir, 'all_india_rate.pkl'))
        df.to_csv(os.path.join(model_dir, 'training_data.csv'), index=False)

        log_info("Models and data saved successfully")
        return True

    except Exception as e:
        log_error(f"Error in train_and_save_model: {str(e)}")
        return False

# ==== LOAD SAVED MODEL ====
def load_saved_models():
    try:
        model_dir = 'models'
        if not os.path.exists(model_dir):
            raise FileNotFoundError("Model directory not found")

        pipeline = joblib.load(os.path.join(model_dir, 'price_pipeline.pkl'))
        knn_model = joblib.load(os.path.join(model_dir, 'knn_model.pkl'))
        knn_data = joblib.load(os.path.join(model_dir, 'knn_data.pkl'))
        city_growth_rates = joblib.load(os.path.join(model_dir, 'city_growth_rates.pkl'))
        all_india_rate = joblib.load(os.path.join(model_dir, 'all_india_rate.pkl'))
        df = pd.read_csv(os.path.join(model_dir, 'training_data.csv'))

        # Add logging to verify the type of objects returned by load_saved_models
        log_info(f"Type of pipeline: {type(pipeline)}")
        log_info(f"Type of knn_model: {type(knn_model)}")
        log_info(f"Type of knn_data: {type(knn_data)}")
        log_info(f"Type of city_growth_rates: {type(city_growth_rates)}")
        log_info(f"Type of all_india_rate: {type(all_india_rate)}")

        return pipeline, knn_model, knn_data, city_growth_rates, all_india_rate, df
    except Exception as e:
        log_error(f"Error loading saved models: {str(e)}")
        raise

# ==== FORECAST FUNCTION ====
def forecast_price(property_type, size, city_name, no_of_bhk=0, data_path=None):
    try:
        # Ensure input types are correct
        size = float(size)
        no_of_bhk = int(no_of_bhk)
        city_name = str(city_name)
        property_type = str(property_type)
        
        log_info(f"Input types after conversion - size: {type(size)}, no_of_bhk: {type(no_of_bhk)}, city_name: {type(city_name)}, property_type: {type(property_type)}")
        
        # Check if models exist, if not train and save them
        model_dir = 'models'
        if not os.path.exists(model_dir) or not os.path.exists(os.path.join(model_dir, 'price_pipeline.pkl')):
            log_info("Models not found. Training new models...")
            if not train_and_save_model(data_path):
                raise Exception("Failed to train models")
        
        try:
            # Load saved models
            pipeline, knn_model, knn_data, city_growth_rates, all_india_rate, df = load_saved_models()
        except FileNotFoundError:
            # If loading fails, try training again
            log_info("Failed to load models. Retraining...")
            if not train_and_save_model(data_path):
                raise Exception("Failed to train models after retry")
            pipeline, knn_model, knn_data, city_growth_rates, all_india_rate, df = load_saved_models()

        if property_type == 'Residential Plot':
            no_of_bhk = 0

        # Prepare input data
        input_df = pd.DataFrame([{
            'Size': size,
            'No_of_BHK': no_of_bhk,
            'City_name': city_name,
            'Property_type': property_type
        }])

        # Add logging to verify the input data
        log_info(f"Input DataFrame before prediction: {input_df}")
        log_info(f"Input DataFrame dtypes: {input_df.dtypes}")

        # Ensure the pipeline is a valid scikit-learn pipeline
        if not hasattr(pipeline, 'predict'):
            raise TypeError("Loaded pipeline is not a valid scikit-learn pipeline")

        # Ensure input_df is compatible with the pipeline
        try:
            model_pred = pipeline.predict(input_df)[0]
        except Exception as e:
            log_error(f"Error during prediction: {str(e)}")
            
            # Try to retrain the model and try again
            log_info("Error during prediction. Attempting to retrain model...")
            if train_and_save_model(data_path):
                pipeline, knn_model, knn_data, city_growth_rates, all_india_rate, df = load_saved_models()
                try:
                    model_pred = pipeline.predict(input_df)[0]
                except Exception as new_e:
                    log_error(f"Error after retraining: {str(new_e)}")
                    raise
            else:
                raise

        # Predict KNN-based average price
        try:
            input_knn = pd.get_dummies(input_df)
            
            # Ensure input_knn has the same columns as knn_data
            # This is crucial to avoid 'str' object has no attribute 'transform' errors
            if isinstance(knn_data, pd.DataFrame):
                # Fill missing columns with 0
                for col in knn_data.columns:
                    if col not in input_knn.columns:
                        input_knn[col] = 0
                # Reindex columns to match knn_data
                input_knn = input_knn.reindex(columns=knn_data.columns, fill_value=0)
            else:
                log_error(f"knn_data is not a DataFrame, it's a {type(knn_data)}")
                # If knn_data is not a DataFrame, try to recreate it
                raise Exception("Invalid knn_data type, model needs to be retrained")
            
            log_info(f"Input KNN DataFrame after reindexing: {input_knn.shape}")
            dists, indices = knn_model.kneighbors(input_knn)
            knn_avg_price = df.iloc[indices[0]]['Price'].mean()
        except Exception as e:
            log_error(f"Error during KNN prediction: {str(e)}")
            # Fallback to using only model prediction
            knn_avg_price = model_pred

        # Blended forecast: 70% model + 30% KNN
        current_price = 0.7 * model_pred + 0.3 * knn_avg_price

        # Get growth rate for the city
        growth_rate = get_growth_rate(city_name)
        
        # Calculate future projections (4 quarters)
        future_projections = []
        for quarter in range(1, 5):
            forecast = current_price * (1 + growth_rate) ** quarter
            future_projections.append(forecast)

        # Calculate ROI and growth percentages
        final_price = future_projections[-1]  # Price after 4 quarters
        total_growth = (final_price - current_price) / current_price * 100
        annualized_roi = ((1 + growth_rate) ** 4 - 1) * 100  # Annualized ROI over 4 quarters
        quarterly_growth_percentage = growth_rate * 100

        result = {
            'currentPrice': float(current_price),
            'futureProjections': [float(x) for x in future_projections],
            'quarterlyGrowthRate': float(quarterly_growth_percentage),
            'growthRateSource': 'City-specific' if city_name in HPI_DATA else 'All India',
            'roi': {
                'totalGrowth': float(total_growth),
                'annualizedROI': float(annualized_roi),
                'quarterlyGrowth': float(quarterly_growth_percentage)
            },
            'projections': {
                'q1': float(future_projections[0]),
                'q2': float(future_projections[1]),
                'q3': float(future_projections[2]),
                'q4': float(future_projections[3])
            }
        }
        
        log_info(f"Prediction successful")
        return result

    except Exception as e:
        log_error(f"Error in forecast_price: {str(e)}")
        raise

# ==== NODE.JS INTEGRATION ====
if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            # Parse the input JSON
            input_data = json.loads(sys.argv[1])
            log_info(f"Received raw input data: {sys.argv[1]}")
            log_info(f"Parsed input data: {json.dumps(input_data, indent=2)}")
            
            # Verify required fields
            required_fields = ['propertyType', 'sqft', 'city', 'bhk', 'dataPath']
            missing_fields = [field for field in required_fields if field not in input_data]
            if missing_fields:
                log_error(f"Missing required fields: {missing_fields}")
                raise ValueError(f"Missing required fields: {missing_fields}")
            
            # Ensure city is a valid string
            if not isinstance(input_data['city'], str) or input_data['city'].isdigit():
                log_info(f"Converting city from {input_data['city']} to a valid string")
                # Try to convert numeric city to a readable name
                # For now, default to "Unknown City" if it's numeric
                if str(input_data['city']).isdigit():
                    input_data['city'] = "Unknown City"
            
            # Add logging to capture the state of the data and models
            log_info(f"Data path: {input_data['dataPath']}")
            
            result = forecast_price(
                input_data['propertyType'],
                input_data['sqft'],
                input_data['city'],
                input_data['bhk'],
                input_data['dataPath']
            )
            # Only print the JSON result to stdout
            print(json.dumps(result))
        except Exception as e:
            error_response = {'error': str(e)}
            print(json.dumps(error_response))
            sys.exit(1)

# Model Files and Datasets

Due to GitHub's file size limitations, the model files and large datasets are not included in this repository. 

## Required Files

The following files are needed for the application to function properly:

### Model Files
- `models/all_india_rate.pkl`
- `models/city_growth_rates.pkl`
- `models/knn_data.pkl`
- `models/knn_model.pkl`
- `models/price_pipeline.pkl`
- `models/training_data.csv`

- `backend/models/all_india_rate.pkl`
- `backend/models/city_growth_rates.pkl`
- `backend/models/knn_data.pkl`
- `backend/models/knn_model.pkl`
- `backend/models/price_pipeline.pkl`
- `backend/models/training_data.csv`

### Dataset Files
- `Makaan_Cleaned.csv`
- `EC-20240829-IN-01.csv`

## How to Get the Files

You can obtain these files in one of the following ways:

1. **Contact the repository owner**: Send a request to the repository owner to get access to these files.

2. **Train the models yourself**: Use the `market.py` script to train the models with your own dataset.

3. **Download from cloud storage**: If available, download the files from the following link:
   - [Download Model Files and Datasets](https://your-storage-link-here)

## Setup Instructions

1. Create the directories if they don't exist:
   ```
   mkdir -p models
   mkdir -p backend/models
   ```

2. Place the downloaded files in their respective directories as listed above.

3. Proceed with the regular setup instructions in the README.md file. 
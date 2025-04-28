# Realestate360

A comprehensive real estate platform that combines property listings with advanced data analytics and machine learning to provide market insights and price predictions.



You Can Check My Project Here : 
https://realestate360-frontend.onrender.com
## Features

- **Property Listings & Management**
  - Browse, filter, and search properties
  - Detailed property pages with full information
  - Upload and edit property listings

- **User Authentication**
  - Login/register system with email verification
  - OTP verification for security
  - User profiles and dashboard

- **Market Analysis**
  - Property price prediction based on location, size, and property type
  - Market trend visualization with charts
  - ROI calculations and quarterly projections

- **Booking System**
  - Property viewing appointment scheduling
  - Booking management

## Tech Stack

### Frontend
- React.js with React Router
- Chart.js for data visualization
- Google Maps & Leaflet for mapping integration
- QR code generation

### Backend
- Node.js/Express.js for property and user management
- Python/Flask for machine learning predictions

### Machine Learning
- Random Forest Regressor for price prediction
- K-Nearest Neighbors for property comparison
- Housing Price Index (HPI) data for trend analysis

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- MongoDB

### Model Files
**Important:** This repository doesn't include model files and datasets due to size limitations. 
Please see [MODELS.md](MODELS.md) for instructions on how to obtain these files.

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup (Node.js)
```bash
cd backend
npm install
node server.js
```

### Backend Setup (Python)
```bash
pip install -r requirements.txt
python app.py
```

## Data
The application uses real estate data for price predictions. Due to file size constraints, the data files are not included in the repository.

## License
MIT

import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import PropertyList from "../components/PropertyList";
import MapPropertySearch from "../components/MapPropertySearch";
import "../styles.css";
import "../styles/MapPropertySearch.css";
import "../styles/MapSearch.css";

// Simplified styles for the property page without upload form
const styles = `
.property-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.btn-add-property {
  background: linear-gradient(145deg, #ff8f00, #ff6d00);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.btn-add-property:hover {
  background: linear-gradient(145deg, #ff6d00, #ff8f00);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.map-search-container {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.map-search-container h2 {
  margin-bottom: 10px;
  font-size: 1.5rem;
}

/* Search Box Styles - Fix Containment Issue */
.search-bar-container {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.search-bar-container input {
  width: 100% !important;
  box-sizing: border-box !important;
  padding: 12px 15px !important;
  font-size: 14px !important;
  border: 1px solid #ddd !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  outline: none !important;
  margin-bottom: 15px !important;
  transition: border-color 0.3s !important;
}

.search-bar-container input:focus {
  border-color: #ff8f00 !important;
  box-shadow: 0 0 0 2px rgba(255, 143, 0, 0.1) !important;
}

.pac-container {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  font-family: inherit;
  margin-top: 5px;
}

.pac-item {
  padding: 8px 15px;
  cursor: pointer;
}

.pac-item:hover {
  background-color: rgba(255, 143, 0, 0.05);
}

.alert {
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading-spinner-profile {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #ff6d00;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text-profile {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.loading-subtext-profile {
  font-size: 14px;
  color: #666;
}
`;

const PropertyPage = ({ isLoggedIn, authToken, userEmail, isEditing }) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Check for upload=true query parameter to redirect to upload page
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('upload') === 'true' && isLoggedIn) {
      navigate('/upload-property');
    }
  }, [location.search, isLoggedIn, navigate]);

  if (isLoading) {
    return (
      <div className="loading-profile">
        <div className="loading-spinner-profile"></div>
        <div className="loading-text-profile">Loading Properties</div>
        <div className="loading-subtext-profile">Please wait...</div>
      </div>
    );
  }

  return (
    <div className="property-page">
      <style>{styles}</style>
      
      <div className="page-header">
        <h1>EXPLORE AVAILABLE PROPERTIES</h1>
        {!isEditing && isLoggedIn && (
          <button 
            className="btn-add-property" 
            onClick={() => navigate('/upload-property')}
          >
            Add New Property
          </button>
        )}
        {!isEditing && !isLoggedIn && (
          <Link to="/login" className="btn-add-property">
            Login to Add Property
          </Link>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <PropertyList isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} />

      <div className="map-search-container">
        <h2>Find Properties on Map</h2>
        <p>Click on the map to search for properties in that area. Adjust the radius to expand or narrow your search.</p>
        <MapPropertySearch />
      </div>
    </div>
  );
};

export default PropertyPage;
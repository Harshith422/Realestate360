import React from 'react';
import '../styles.css';
import './EnhancedPropertyDetails.css';

const EnhancedPropertyDetails = ({ property }) => {
  if (!property) {
    return <div className="error-message">Property information not available.</div>;
  }

  const propertyType = property.propertyType || "flat";

  return (
    <div className="enhanced-property-details">
      {/* Detailed Description Section */}
      <div className="property-description-section">
        <h3>About This Property</h3>
        <div className="property-description">
          <p>{property.description}</p>
        </div>
        
        {/* Key Features */}
        <div className="key-features">
          <h4>Key Features</h4>
          <ul>
            {(property.keyHighlights || []).map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Property Details Grid */}
      <div className="property-details-section">
        <h3>Property Details</h3>
        <div className="property-info-grid">
          <div className="property-info-item">
            <strong>Price:</strong>
            <span>{property.price}</span>
          </div>
          
          <div className="property-info-item">
            <strong>Location:</strong>
            <span>{property.location}</span>
          </div>
          
          {/* Flat specific details */}
          {propertyType === "flat" && (
            <>
              <div className="property-info-item">
                <strong>Area:</strong>
                <span>{property.area}</span>
              </div>
              
              <div className="property-info-item">
                <strong>Bedrooms:</strong>
                <span>{property.bedrooms}</span>
              </div>
              
              <div className="property-info-item">
                <strong>Bathrooms:</strong>
                <span>{property.bathrooms}</span>
              </div>

              <div className="property-info-item">
                <strong>Floor:</strong>
                <span>{property.floor || 'Not specified'}</span>
              </div>

              <div className="property-info-item">
                <strong>Furnishing:</strong>
                <span>{property.furnishing || 'Not specified'}</span>
              </div>

              <div className="property-info-item">
                <strong>Parking:</strong>
                <span>{property.parking || 'Not specified'}</span>
              </div>
            </>
          )}
          
          {/* Land specific details */}
          {propertyType === "land" && (
            <>
              <div className="property-info-item">
                <strong>Total Land Area:</strong>
                <span>{property.landArea}</span>
              </div>
              
              <div className="property-info-item">
                <strong>Land Type:</strong>
                <span>
                  {property.landType && property.landType.charAt(0).toUpperCase() + property.landType.slice(1)}
                </span>
              </div>

              <div className="property-info-item">
                <strong>Soil Type:</strong>
                <span>{property.soilType || 'Not specified'}</span>
              </div>

              <div className="property-info-item">
                <strong>Road Access:</strong>
                <span>{property.roadAccess || 'Not specified'}</span>
              </div>

              <div className="property-info-item">
                <strong>Water Supply:</strong>
                <span>{property.waterSupply || 'Not specified'}</span>
              </div>

              <div className="property-info-item">
                <strong>Electricity:</strong>
                <span>{property.electricity || 'Not specified'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="additional-info-section">
        <h3>Additional Information</h3>
        <div className="additional-info-grid">
          <div className="additional-info-item">
            <strong>Property Age:</strong>
            <span>{property.age || 'Not specified'}</span>
          </div>

          <div className="additional-info-item">
            <strong>Possession Status:</strong>
            <span>{property.possessionStatus || 'Not specified'}</span>
          </div>

          <div className="additional-info-item">
            <strong>Property Tax:</strong>
            <span>{property.propertyTax || 'Not specified'}</span>
          </div>

          <div className="additional-info-item">
            <strong>Maintenance Charges:</strong>
            <span>{property.maintenanceCharges || 'Not specified'}</span>
          </div>
        </div>
      </div>

      {/* Location Advantages */}
      <div className="location-advantages">
        <h3>Location Advantages</h3>
        <div className="advantages-grid">
          <div className="advantage-item">
            <strong>Schools:</strong>
            <span>{property.nearbySchools || 'Not specified'}</span>
          </div>

          <div className="advantage-item">
            <strong>Hospitals:</strong>
            <span>{property.nearbyHospitals || 'Not specified'}</span>
          </div>

          <div className="advantage-item">
            <strong>Shopping:</strong>
            <span>{property.nearbyShopping || 'Not specified'}</span>
          </div>

          <div className="advantage-item">
            <strong>Transportation:</strong>
            <span>{property.transportation || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPropertyDetails; 
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NearbyAmenities from "./NearbyAmenities";
import MarketTrends from "./MarketTrends";
import ChatInterface from "./ChatInterface";
import "../styles.css";
import "./EnhancedPropertyDetails.css";

const ImageGallery = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  const selectImage = (index) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    selectImage(newIndex);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex + 1) % images.length;
    selectImage(newIndex);
  };

  return (
    <div className="property-gallery">
      <div className="main-image-container" onClick={() => setShowFullGallery(true)}>
        <div className={`image-loading-placeholder ${isLoading ? 'visible' : ''}`} />
        <img
          src={images[currentIndex]}
          alt="Property"
          className={`main-image ${isTransitioning ? 'changing' : ''} ${isLoading ? 'loading' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {images.length > 1 && (
          <>
            <button className="gallery-nav prev" onClick={handlePrev} aria-label="Previous image">&lt;</button>
            <button className="gallery-nav next" onClick={handleNext} aria-label="Next image">&gt;</button>
            <div className="image-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="thumbnail-container">
          {images.map((img, index) => (
            <div
              key={index}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => selectImage(index)}
              role="button"
              aria-label={`View image ${index + 1}`}
              tabIndex={0}
            >
              <img src={img} alt={`Thumbnail ${index + 1}`} />
            </div>
          ))}
        </div>
      )}

      {showFullGallery && (
        <div className="full-gallery-overlay" onClick={() => setShowFullGallery(false)}>
          <div className="full-gallery-content" onClick={e => e.stopPropagation()}>
            <button className="close-gallery" onClick={() => setShowFullGallery(false)} aria-label="Close gallery">×</button>
            <div className={`full-image-container ${isLoading ? 'loading' : ''}`}>
              <div className="image-loading-placeholder" />
              <img
                src={images[currentIndex]}
                alt="Property"
                className={`full-image ${isTransitioning ? 'changing' : ''} ${isLoading ? 'loading' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  margin: 'auto'
                }}
              />
              {images.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={handlePrev} aria-label="Previous image">&lt;</button>
                  <button className="gallery-nav next" onClick={handleNext} aria-label="Next image">&gt;</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyDetails = ({ property, isLoggedIn, userEmail, isOwner, onDelete }) => {
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [nearbyCity, setNearbyCity] = useState(null);
  const navigate = useNavigate();
  
  // Check user profile before showing chat interface
  const toggleChatInterface = async () => {
    if (isLoggedIn && !isOwner) {
      try {
        setCheckingProfile(true);
        setShowProfileWarning(false);
        const authToken = localStorage.getItem("authToken");
        
        const response = await fetch("http://localhost:5000/users/profile", {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error("Failed to check user profile");
        }
        
        const profileData = await response.json();
        
        // Check if required profile fields are filled
        const isComplete = profileData.fullName && 
                           profileData.phone && 
                           profileData.address;
        
        setProfileComplete(isComplete);
        
        if (!isComplete) {
          // Show profile warning instead of modal
          setShowProfileWarning(true);
          return;
        }
        
        // Profile is complete, show chat interface
        setShowChatInterface(true);
      } catch (error) {
        console.error("Error checking user profile:", error);
        // Still allow showing chat interface if profile check fails
        setShowChatInterface(true);
      } finally {
        setCheckingProfile(false);
      }
    }
  };

  const closeChatInterface = () => {
    setShowChatInterface(false);
  };
  
  // If no property is provided, show error message
  if (!property) {
    return <div className="error-message">Property information not available.</div>;
  }

  // Handle both images array and legacy single image
  const images = property.images || (property.image ? [property.image] : []);
  const propertyType = property.propertyType || "flat";

  // Function to handle nearby city update from NearbyAmenities
  const handleNearbyCityUpdate = (cities) => {
    if (cities && cities.length > 0) {
      // Take the closest city
      const closestCity = cities[0];
      setNearbyCity(closestCity);
    }
  };

  return (
    <div className="property-details">
      <div className="page-header">
        <h1>EXPLORE AVAILABLE PROPERTIES</h1>
      </div>
      
      <div className="property-header">
        <h2>{property.name}</h2>
        {isOwner && (
          <Link 
            to={`/edit-property/${property._id || property.id}`} 
            className="btn btn-edit"
          >
            Edit Property
          </Link>
        )}
      </div>
      
      {/* Image Gallery */}
      <ImageGallery images={images} />
      
      {/* Enhanced Property Details */}
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
          <div className="property-info-grid">
            <div className="property-info-row">
              <div className="property-info-item">
                <strong>Price:</strong>
                <span>{property.price}</span>
              </div>
              
              <div className="property-info-item">
                <strong>Location:</strong>
                <span>{property.location}</span>
              </div>

              <div className="property-info-item">
                <strong>Property Type:</strong>
                <span>{propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</span>
              </div>
            </div>

            {propertyType === "flat" && (
              <div className="property-info-row">
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
              </div>
            )}

            {/* Navigation and booking buttons */}
            {property.coordinates && property.coordinates.length === 2 && (
              <div className="property-navigation" style={{ 
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                marginTop: '20px',
                width: '100%',
                padding: '0 15px'
              }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${property.coordinates[0]},${property.coordinates[1]}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    backgroundColor: '#8B4513',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    fontSize: '16px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: '200px'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>🧭</span> Navigate to Property
                </a>
                {isLoggedIn && !isOwner && (
                  <button 
                    onClick={toggleChatInterface} 
                    disabled={checkingProfile}
                    style={{
                      backgroundColor: '#8B4513',
                      color: 'white',
                      padding: '15px 20px',
                      borderRadius: '8px',
                      flex: 1,
                      fontSize: '16px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '200px'
                    }}
                  >
                    {checkingProfile ? 'Checking profile...' : 'Book Appointment'}
                  </button>
                )}
              </div>
            )}

            {propertyType === "land" && (
              <div className="property-info-row">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nearby Amenities Integration */}
      <NearbyAmenities 
        coordinates={property.coordinates} 
        onNearbyCityUpdate={handleNearbyCityUpdate}
      />

      {/* Market Trends Integration */}
      {property && (
        <div className="market-trends-wrapper">
          <MarketTrends 
            propertyId={property.id}
            propertyDetails={{
              price: property.price || "0",
              area: property.area ? parseInt(property.area) : 0,
              bedrooms: property.bedrooms ? parseInt(property.bedrooms) : 0,
              propertyType: property.propertyType || "Apartment",
              city: nearbyCity?.name || property.location?.split(',')[0] || "Unknown"
            }}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="property-action-buttons">
        <div className="button-container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/properties" className="btn btn-secondary">Back to Properties</Link>
          {isOwner && onDelete && (
            <button onClick={onDelete} className="btn btn-delete">Delete Property</button>
          )}
          
          {/* Login reminder */}
          {!isLoggedIn && (
            <p className="login-reminder">🔒 Please <Link to="/login">Login</Link> to book an appointment.</p>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      {showChatInterface && (
        <ChatInterface
          propertyId={property.id}
          userEmail={userEmail}
          onClose={closeChatInterface}
        />
      )}
    </div>
  );
};

export default PropertyDetails;

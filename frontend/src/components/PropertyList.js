import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles.css";
import "../styles/EditProperty.css";
import "../styles/Loading.css";

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div className="loading-text">Loading properties</div>
    </div>
  );
};

const PropertyCard = ({ property, index, isOwner, onDelete, isLoggedIn }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasMultipleImages = property.images && property.images.length > 1;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  const transitionToImage = (index) => {
    setIsTransitioning(true);
    setIsLoading(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  const goToNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasMultipleImages) {
      const newIndex = currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1;
      transitionToImage(newIndex);
    }
  };

  const goToPrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasMultipleImages) {
      const newIndex = currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1;
      transitionToImage(newIndex);
    }
  };

  // If images is not defined or empty, use a default image
  const imageSrc = property.images && property.images.length > 0
    ? property.images[currentImageIndex]
    : property.image || "/images/placeholder.jpg"; // Fallback to single image if exists

  return (
    <div className="property-card" style={{ "--i": index + 1 }}>
      <div className="property-type-tag property-type-tag-hover" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#4A90E2',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        zIndex: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textTransform: 'capitalize',
        border: 'none',
        cursor: 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '40px',
        maxWidth: '60px',
        transition: 'all 0.3s ease'
      }}>
        {property.propertyType === 'flat' ? 'Flat' : 'Land'}
      </div>
      <div className={`image-container ${isLoading ? 'loading' : ''}`} style={{
        position: 'relative',
        width: '100%',
        height: '0',
        paddingBottom: '75%', /* Creates a 4:3 aspect ratio */
        overflow: 'hidden',
        borderRadius: '8px 8px 0 0'
      }}>
        <div className="image-loading-placeholder" />
        <img 
          src={imageSrc} 
          alt={property.name} 
          className={isTransitioning ? 'changing' : ''}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {hasMultipleImages && (
          <>
            <button 
              className="image-nav prev" 
              onClick={goToPrevImage}
              aria-label="Previous image"
            >
              {'<'}
            </button>
            <button 
              className="image-nav next" 
              onClick={goToNextImage}
              aria-label="Next image"
            >
              {'>'}
            </button>
            <div className="image-indicator">
              {property.images.map((_, imgIndex) => (
                <span 
                  key={imgIndex} 
                  className={`indicator-dot ${imgIndex === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    transitionToImage(imgIndex);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="property-card-content">
        <h3>{property.name}</h3>
        <p className="property-price">{property.price}</p>
        <p className="property-description-short">
          {property.description && property.description.length > 100
            ? `${property.description.substring(0, 100)}...`
            : property.description}
        </p>
        <p>📍 {property.location}</p>
        <div className="property-features">
          {/* Show flat specific details */}
          {property.propertyType === "flat" && (
            <>
              <div className="property-feature">
                <span>📏 {property.area}</span>
              </div>
              <div className="property-feature">
                <span>🛏️ {property.bedrooms} BR</span>
              </div>
              <div className="property-feature">
                <span>🚿 {property.bathrooms} BA</span>
              </div>
            </>
          )}
          
          {/* Show land specific details */}
          {property.propertyType === "land" && (
            <>
              <div className="property-feature">
                <span>📏 {property.landArea}</span>
              </div>
              <div className="property-feature">
                <span>🏞️ {property.landType && property.landType.charAt(0).toUpperCase() + property.landType.slice(1)}</span>
              </div>
            </>
          )}
        </div>
        <Link to={`/property/${property.id}`} className="btn btn-view-details">View Details</Link>
      </div>
    </div>
  );
};

const PropertyList = ({ isLoggedIn, authToken, userEmail }) => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("all"); // "all", "flat", "land"

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await api.get("/properties");
      setProperties(response.data);
      setFilteredProperties(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to load properties. Please try again later.");
      // Set fallback properties if API call fails
      const fallbackProperties = [
        {
          id: "1",
          name: "Land/Plot in Sector-16, Yamuna Expressway",
          description: "This is a beautiful land plot with excellent connectivity and infrastructure.",
          price: "₹1.05 Crore",
          location: "Sector-16, Yamuna Expressway, Greater Noida",
          propertyType: "land",
          landArea: "120 sq.m.",
          landType: "residential",
          legalClearance: "All documents verified",
          images: ["/images/plot.jpg", "/images/plot2.jpg"]
        },
        {
          id: "2",
          name: "3BHK Apartment in Sector-18, Noida",
          description: "Spacious 3BHK apartment with modern amenities and great location.",
          price: "₹90 Lakh",
          location: "Sector-18, Noida, Uttar Pradesh",
          propertyType: "flat",
          area: "1500 sq.ft.",
          bedrooms: 3,
          bathrooms: 2,
          images: ["/images/plot2.jpg"]
        }
      ];
      setProperties(fallbackProperties);
      setFilteredProperties(fallbackProperties);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await api.delete(`/properties/${propertyId}`);
        setProperties(properties.filter((property) => property.id !== propertyId));
        setFilteredProperties(filteredProperties.filter((property) => property.id !== propertyId));
      } catch (error) {
        console.error("Error deleting property:", error);
        alert("Failed to delete property. Please try again later.");
      }
    }
  };

  // Filter and sort properties based on search term and sort type
  useEffect(() => {
    let result = [...properties];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(property => 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by property type
    if (sortType !== "all") {
      result = result.filter(property => property.propertyType === sortType);
    }
    
    setFilteredProperties(result);
  }, [properties, searchTerm, sortType]);

  useEffect(() => {
    fetchProperties();

    // Listen for property upload events to refresh the list
    const handlePropertyUploaded = () => {
      fetchProperties();
    };

    window.addEventListener('propertyUploaded', handlePropertyUploaded);

    return () => {
      window.removeEventListener('propertyUploaded', handlePropertyUploaded);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (type) => {
    setSortType(type);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="property-list">
      <div className="search-sort-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search properties by name, description, or location..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="sort-container">
          <button 
            className={`sort-button ${sortType === 'all' ? 'active' : ''}`}
            onClick={() => handleSortChange('all')}
          >
            All
          </button>
          <button 
            className={`sort-button ${sortType === 'flat' ? 'active' : ''}`}
            onClick={() => handleSortChange('flat')}
          >
            Flats
          </button>
          <button 
            className={`sort-button ${sortType === 'land' ? 'active' : ''}`}
            onClick={() => handleSortChange('land')}
          >
            Land
          </button>
        </div>
      </div>
      
      {filteredProperties.length === 0 ? (
        <div className="no-properties">
          <p>No properties found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid">
          {filteredProperties.map((property, index) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              index={index} 
              isOwner={isLoggedIn && property.ownerEmail === userEmail}
              onDelete={deleteProperty}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyList;
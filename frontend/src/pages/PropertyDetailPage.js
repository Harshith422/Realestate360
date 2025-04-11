import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropertyDetails from "../components/PropertyDetails";

const PropertyDetailPage = ({ isLoggedIn, authToken, userEmail }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation effect when component mounts
    setIsAnimating(true);
    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 800);

    // Function to fetch property data
    const fetchPropertyData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/properties/${id}`);
        
        if (!response.ok) {
          // If API call fails, use fallback data
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setProperty(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching property details:", err);
        setError("Failed to load property details. Using fallback data.");
        
        // Fallback data if API call fails
        setProperty({
          id: id,
          name: `Property ${id}`,
          description: "Property description unavailable.",
          price: "Price information unavailable",
          location: "Location information unavailable",
          propertyType: "flat",
          area: "Size information unavailable",
          bedrooms: 0,
          bathrooms: 0,
          image: "/images/plot.jpg",
          keyHighlights: ["Information currently unavailable"],
          lat: 28.3542,
          lng: 77.5295
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();

    return () => {
      clearTimeout(animationTimer);
    };
  }, [id]);

  // Delete property handler
  const handleDeleteProperty = async () => {
    if (!isLoggedIn || !authToken) {
      alert("You must be logged in to delete a property");
      return;
    }

    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      try {
        const response = await fetch(`http://localhost:5000/properties/${id}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete property");
        }

        // Show success message
        alert("Property deleted successfully");
        
        // Redirect to properties page
        navigate("/properties");
        
        // Dispatch event to refresh other components
        window.dispatchEvent(new CustomEvent('propertyDeleted'));
      } catch (error) {
        console.error("Error deleting property:", error);
        alert(`Failed to delete property: ${error.message}`);
      }
    }
  };

  if (loading) {
    return <div className="loading-container">Loading property details</div>;
  }

  if (error && !property) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`property-detail-page ${isAnimating ? 'page-animating' : ''}`}>
      <div className="page-transition-overlay"></div>
      <PropertyDetails 
        property={property} 
        isLoggedIn={isLoggedIn} 
        userEmail={userEmail}
        isOwner={isLoggedIn && property.ownerEmail === userEmail}
        onDelete={handleDeleteProperty}
      />
    </div>
  );
}

export default PropertyDetailPage; 
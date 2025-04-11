import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import "../styles/MapPropertySearch.css";

// Default map container style
const containerStyle = {
  width: '100%',
  height: '400px'
};

// Default map center (India)
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629
};

// Add this validation function at the top of the component
const validateUserPosition = (pos) => {
  console.log("Validating userPosition:", pos);
  if (!pos) {
    console.log("userPosition is null/undefined");
    return false;
  }
  
  if (!Array.isArray(pos)) {
    console.log("userPosition is not an array:", typeof pos);
    if (typeof pos === 'object' && 'lat' in pos && 'lng' in pos) {
      console.log("userPosition is already in {lat, lng} format");
      return true; // It's already in the right format
    }
    return false;
  }
  
  if (pos.length !== 2) {
    console.log("userPosition array length is not 2:", pos.length);
    return false;
  }
  
  if (typeof pos[0] !== 'number' || typeof pos[1] !== 'number') {
    console.log("userPosition array elements are not numbers:", typeof pos[0], typeof pos[1]);
    return false;
  }
  
  if (isNaN(pos[0]) || isNaN(pos[1])) {
    console.log("userPosition array elements are NaN");
    return false;
  }
  
  console.log("userPosition is valid");
  return true;
};

const PropertyLocationPicker = ({ userPosition, onLocationSelected }) => {
  console.log("PropertyLocationPicker rendering with userPosition:", userPosition);
  
  // State for forcing map re-renders
  const [mapKey, setMapKey] = useState(Date.now());
  
  // Check if API key is available
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  console.log("API Key available:", apiKey ? 'Yes' : 'No');
  
  // Load the Google Maps API with places library
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['places']
  });

  // State for position, search query, and refs
  const [position, setPosition] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState("");
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  // Initialize geocoder when map is loaded
  useEffect(() => {
    if (isLoaded && window.google && !geocoderRef.current) {
      try {
        geocoderRef.current = new window.google.maps.Geocoder();
        console.log("Geocoder initialized successfully");
      } catch (error) {
        console.error("Failed to initialize geocoder:", error);
      }
    }
  }, [isLoaded]);

  // Update the useEffect for position initialization
  useEffect(() => {
    console.log("Initial position setup with userPosition:", userPosition);
    
    if (validateUserPosition(userPosition)) {
      const newPos = Array.isArray(userPosition) 
        ? { lat: userPosition[0], lng: userPosition[1] } 
        : userPosition; // In case it's already in {lat, lng} format
      
      console.log("Setting initial position to:", newPos);
      setPosition(newPos);
    } else {
      console.log("Using default center as initial position");
      setPosition(defaultCenter);
    }
  }, []);

  // Update the useEffect for userPosition changes
  useEffect(() => {
    console.log("userPosition changed:", userPosition);
    
    if (validateUserPosition(userPosition)) {
      const newPos = Array.isArray(userPosition)
        ? { lat: userPosition[0], lng: userPosition[1] }
        : userPosition; // In case it's already in {lat, lng} format
      
      console.log("Updating position to:", newPos);
      setPosition(newPos);
      
      // Force map to re-render with new position
      setMapKey(Date.now());

      // If map is loaded, center on the new position
      if (mapRef.current) {
        console.log("Panning map to new position");
        mapRef.current.panTo(newPos);
        mapRef.current.setZoom(15);
      }
    }
  }, [userPosition]);

  // Handle map load
  const onLoad = useCallback((map) => {
    console.log("Map loaded successfully");
    mapRef.current = map;
    
    // Center map on current position
    console.log("Centering map on position:", position);
    map.setCenter(position);
    map.setZoom(15);
  }, [position]);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    console.log("Map unmounted");
    mapRef.current = null;
  }, []);

  // Handle Autocomplete load
  const onAutocompleteLoad = (autocomplete) => {
    console.log("Autocomplete loaded");
    autocompleteRef.current = autocomplete;
  };

  // Handle place selection from Autocomplete
  const onPlaceChanged = () => {
    if (!autocompleteRef.current) {
      console.error("Autocomplete ref not available");
      return;
    }
    
    const place = autocompleteRef.current.getPlace();
    
    if (!place) {
      console.error("Place is undefined");
      return;
    }
    
    console.log("Place selected:", place);
    
    // Check if place has geometry
    if (place.geometry && place.geometry.location) {
      const newPosition = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      
      console.log("New position from place selection:", newPosition);
      
      // Update position
      setPosition(newPosition);
      setSearchQuery(place.formatted_address || place.name || "");
      
      // Pan to the new location
      if (mapRef.current) {
        mapRef.current.panTo(newPosition);
        mapRef.current.setZoom(16);
      }
      
      // Notify the parent component
      if (onLocationSelected) {
        console.log("Notifying parent of location selection");
        onLocationSelected([newPosition.lat, newPosition.lng], place.formatted_address || place.name || "");
      }
    }
  };

  // Handle map click
  const handleMapClick = (e) => {
    if (!e || !e.latLng) {
      console.error("Invalid map click event");
      return;
    }
    
    try {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      
      console.log("Map clicked at:", newPosition);
      setPosition(newPosition);
      
      // Reverse geocode to get address
      if (isLoaded && geocoderRef.current) {
        console.log("Reverse geocoding for address");
        geocoderRef.current.geocode({ location: newPosition })
          .then((response) => {
            if (response.results && response.results.length > 0) {
              const address = response.results[0].formatted_address;
              console.log("Found address:", address);
              setSearchQuery(address);
              
              // Notify parent component with updated information
              if (onLocationSelected) {
                console.log("Notifying parent of map click location");
                onLocationSelected([newPosition.lat, newPosition.lng], address);
              }
            }
          })
          .catch((error) => {
            console.error("Geocoder failed:", error);
          });
      }
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e) => {
    if (!e || !e.latLng) {
      console.error("Invalid marker drag event");
      return;
    }
    
    try {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      
      console.log("Marker dragged to:", newPosition);
      setPosition(newPosition);
      
      // Reverse geocode to get address
      if (isLoaded && geocoderRef.current) {
        console.log("Reverse geocoding after marker drag");
        geocoderRef.current.geocode({ location: newPosition })
          .then((response) => {
            if (response.results && response.results.length > 0) {
              const address = response.results[0].formatted_address;
              console.log("Found address:", address);
              setSearchQuery(address);
              
              // Notify parent component with updated information
              if (onLocationSelected) {
                console.log("Notifying parent of marker drag location");
                onLocationSelected([newPosition.lat, newPosition.lng], address);
              }
            }
          })
          .catch((error) => {
            console.error("Geocoder failed:", error);
          });
      }
    } catch (error) {
      console.error("Error handling marker drag:", error);
    }
  };

  // Add a function to handle the center pin selection
  const handleCenterSelection = (e) => {
    // Prevent default button behavior which causes page scrolling
    e.preventDefault();
    e.stopPropagation();
    
    if (!mapRef.current) {
      console.error("Map reference not available");
      return;
    }
    
    // Get the center of the map
    const center = mapRef.current.getCenter();
    const newPosition = {
      lat: center.lat(),
      lng: center.lng()
    };
    
    console.log("Center selection at:", newPosition);
    setPosition(newPosition);
    
    // Reverse geocode to get address
    if (isLoaded && geocoderRef.current) {
      console.log("Reverse geocoding center position");
      geocoderRef.current.geocode({ location: newPosition })
        .then((response) => {
          if (response.results && response.results.length > 0) {
            const address = response.results[0].formatted_address;
            console.log("Found address:", address);
            setSearchQuery(address);
            
            // Notify parent component with updated information
            if (onLocationSelected) {
              console.log("Notifying parent of center selection");
              onLocationSelected([newPosition.lat, newPosition.lng], address);
            }
          }
        })
        .catch((error) => {
          console.error("Geocoder failed:", error);
        });
    }
  };

  // Instructions for users
  const renderInstructions = () => (
    <div className="map-instructions">
      <p>
        <strong>Find your property location:</strong>
      </p>
      <ol>
        <li>Search for your area in the search box, or</li>
        <li>Navigate the map and position the red crosshair over your property location</li>
        <li>Click the "Select this location" button to set the pin, or</li>
        <li>Click directly on the map to place the pin at that spot</li>
        <li>Drag the red marker to fine-tune the location if needed</li>
      </ol>
    </div>
  );

  console.log("Map loading status:", isLoaded ? "Loaded" : "Loading", "Error:", loadError ? "Yes" : "No");
  console.log("Current position:", position);

  // If there's an error loading the map, show an error message
  if (loadError) {
    console.error("Map load error:", loadError);
    return (
      <div className="map-error">
        <h3>Error loading Google Maps</h3>
        <p>Please check your Google Maps API key configuration.</p>
        <p>Error details: {loadError.message}</p>
        <div className="map-fallback">
          <label htmlFor="manual-location">Enter location manually:</label>
          <input
            type="text"
            id="manual-location"
            placeholder="Enter property address"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onLocationSelected) {
                onLocationSelected(null, e.target.value);
              }
            }}
            className="manual-location-input"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="map-property-search simplified">
      {renderInstructions()}
      
      <div className="search-options">
        <div className="search-bar-container">
          {isLoaded && (
            <div className="search-input-wrapper">
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                restrictions={{ country: 'in' }}
              >
                <input
                  type="text"
                  placeholder="Search for a location, landmark, or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="location-search-input"
                />
              </Autocomplete>
              {searchQuery && (
                <button 
                  className="clear-search" 
                  onClick={() => {
                    setSearchQuery("");
                    setMapKey(Date.now());
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        {isLoaded ? (
          <div className="map-with-crosshair-container">
            <div className="map-crosshair" title="Click on the map to set this location as your property location">
              <div className="crosshair-horizontal"></div>
              <div className="crosshair-vertical"></div>
            </div>
            <button 
              className="center-select-button" 
              onClick={handleCenterSelection}
              title="Select this location as your property location"
              type="button"
            >
              <span className="pin-icon">📍</span> 
              Select this location
            </button>
            <GoogleMap
              key={mapKey}
              mapContainerStyle={containerStyle}
              center={position}
              zoom={15}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={handleMapClick}
              options={{
                fullscreenControl: false,
                streetViewControl: false,
                zoomControl: true,
                mapTypeControl: false,
                gestureHandling: 'greedy',
                disableDefaultUI: false,
                clickableIcons: false,
                maxZoom: 20,
                minZoom: 3
              }}
            >
              {position && (
                <Marker
                  position={position}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    scaledSize: new window.google.maps.Size(32, 32)
                  }}
                  visible={true}
                  zIndex={1000}
                />
              )}
            </GoogleMap>
          </div>
        ) : (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading Map...</p>
          </div>
        )}
      </div>
      
      {position && (
        <div className="location-coordinates">
          <small>
            Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </small>
        </div>
      )}
    </div>
  );
};

export default PropertyLocationPicker; 
import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle, Autocomplete } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import "../styles/MapPropertySearch.css";

// Default map container style
const containerStyle = {
  width: '100%',
  height: '500px'
};

// Default map center (India)
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629
};

// Define circle options
const circleOptions = {
  strokeColor: '#0000FF',
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: '#0000FF',
  fillOpacity: 0.1
};

const MapPropertySearch = ({ userPosition, searchRadius = 5000, onLocationSelected }) => {
  // Load the Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  // State for position and map
  const [position, setPosition] = useState(
    userPosition 
      ? { lat: userPosition[0], lng: userPosition[1] } 
      : defaultCenter
  );
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(searchRadius); // Search radius in meters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const geocoder = useRef(null);
  const mapRef = useRef(null);
  const [markerAnimation, setMarkerAnimation] = useState(null);

  // Initialize geocoder when map is loaded
  useEffect(() => {
    if (isLoaded && window.google && !geocoder.current) {
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Add a validation function to check if position is valid
  const isValidPosition = (pos) => {
    if (!pos) return false;
    if (typeof pos !== 'object') return false;
    if (pos.lat === undefined || pos.lng === undefined) return false;
    if (typeof pos.lat !== 'number' || typeof pos.lng !== 'number') return false;
    if (isNaN(pos.lat) || isNaN(pos.lng)) return false;
    return true;
  };

  // Update the useEffect for position changes to check position validity
  useEffect(() => {
    if (isValidPosition(position) && onLocationSelected) {
      onLocationSelected([position.lat, position.lng], searchQuery);
    }
  }, [position, searchQuery, onLocationSelected]);

  // Fetch nearby properties when position changes
  useEffect(() => {
    const fetchNearbyProperties = async () => {
      if (!position) return;
      
      setLoading(true);
      try {
        // Fetch all properties
        const response = await fetch(`http://localhost:5000/properties`);
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const allProperties = await response.json();
        
        // Filter properties with coordinates within radius
        const nearbyProps = allProperties.filter(property => {
          if (!property.coordinates) return false;
          
          // Calculate distance between points using Haversine formula
          const distance = calculateDistance(
            position.lat, position.lng,
            property.coordinates[0], property.coordinates[1]
          );
          
          // Convert distance from km to meters and check if within radius
          return distance * 1000 <= radius;
        });
        
        setProperties(nearbyProps);
      } catch (error) {
        console.error('Error fetching nearby properties:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNearbyProperties();
  }, [position, radius]);
  
  // Calculate distance between two points using Haversine formula (in kilometers)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Handle Autocomplete load
  const onAutocompleteLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  // Handle map load
  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  // Pan and zoom map to new location
  const panToLocation = (location) => {
    if (mapRef.current) {
      mapRef.current.panTo(location);
      mapRef.current.setZoom(14); // Zoom in closer
      
      // Add bounce animation to the marker
      setMarkerAnimation(window.google.maps.Animation.BOUNCE);
      
      // Stop the animation after 2 seconds
      setTimeout(() => {
        setMarkerAnimation(null);
      }, 2000);
    }
  };

  // Handle place selection from Autocomplete
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (!place) {
        console.error("Place is undefined");
        return;
      }
      
      // Check if place has geometry
      if (place.geometry && place.geometry.location) {
        const newPosition = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setPosition(newPosition);
        setSearchQuery(place.formatted_address || place.name || "");
        
        // Pan to the new location
        panToLocation(newPosition);
        
        // Also notify the parent component if onLocationSelected is provided
        if (onLocationSelected) {
          onLocationSelected([newPosition.lat, newPosition.lng], place.formatted_address || place.name || "");
        }
      } else {
        // If no geometry, try to geocode the text
        if (geocoder.current && place.name) {
          setSearchLoading(true);
          geocoder.current.geocode({ address: place.name })
            .then((response) => {
              if (response.results && response.results.length > 0) {
                const location = response.results[0].geometry.location;
                const newPosition = {
                  lat: location.lat(),
                  lng: location.lng()
                };
                
                setPosition(newPosition);
                setSearchQuery(response.results[0].formatted_address || place.name);
                
                // Pan to the new location
                panToLocation(newPosition);
                
                // Notify the parent component
                if (onLocationSelected) {
                  onLocationSelected([newPosition.lat, newPosition.lng], response.results[0].formatted_address || place.name);
                }
              }
            })
            .catch((error) => {
              console.error("Geocoding failed:", error);
            })
            .finally(() => {
              setSearchLoading(false);
            });
        } else {
          console.error("Selected place has no geometry or name");
        }
      }
    }
  };
  
  // Handle map click
  const handleMapClick = (e) => {
    const newPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    
    setPosition(newPosition);
    setActiveMarker(null);
    
    // Add bounce animation
    setMarkerAnimation(window.google.maps.Animation.BOUNCE);
    setTimeout(() => {
      setMarkerAnimation(null);
    }, 2000);
    
    // Reverse geocode to get address
    if (isLoaded && geocoder.current) {
      geocoder.current.geocode({ location: newPosition })
        .then((response) => {
          if (response.results && response.results.length > 0) {
            const address = response.results[0].formatted_address;
            setSearchQuery(address);
            
            // Notify parent component
            if (onLocationSelected) {
              onLocationSelected([newPosition.lat, newPosition.lng], address);
            }
          }
        })
        .catch((error) => {
          console.error("Geocoder failed: ", error);
        });
    }
  };
  
  const handleRadiusChange = (e) => {
    setRadius(parseInt(e.target.value));
  };
  
  // Update position when userPosition changes
  useEffect(() => {
    if (userPosition && Array.isArray(userPosition) && userPosition.length === 2) {
      const newPosition = { 
        lat: userPosition[0], 
        lng: userPosition[1] 
      };
      setPosition(newPosition);
      
      // Pan to the location if map is available
      if (mapRef.current) {
        panToLocation(newPosition);
      }
    }
  }, [userPosition]);

  // Handle load error
  if (loadError) {
    return (
      <div className="map-error">
        <h3>Error loading Google Maps</h3>
        <p>Please check your API key configuration and try again.</p>
        <p>Error details: {loadError.message}</p>
      </div>
    );
  }

  return (
    <div className="map-property-search">
      <div className="search-options">
        <div className="search-bar-container">
          {isLoaded && (
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              restrictions={{ country: 'in' }}
            >
              <input
                type="text"
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="location-search-input"
                ref={inputRef}
              />
            </Autocomplete>
          )}
        </div>
      
        <div className="radius-control">
          <label htmlFor="radius">Search Radius: {radius/1000} km</label>
          <input 
            type="range" 
            id="radius" 
            min="1000" 
            max="20000" 
            step="1000" 
            value={radius} 
            onChange={handleRadiusChange}
          />
          <small className="search-tip">Click anywhere on the map to search for properties in that area</small>
        </div>
        <div className="properties-count">
          {loading ? 'Searching...' : `Found ${properties.length} properties in this area`}
        </div>
      </div>
      
      <div className="map-container" style={{ height: "500px", width: "100%", marginTop: "10px" }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={isValidPosition(position) ? position : defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: false
            }}
          >
            {/* Display search location marker */}
            {isValidPosition(position) && (
              <Marker
                position={position}
                animation={markerAnimation}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : undefined
                }}
              />
            )}
            
            {/* Circle showing search radius */}
            {isValidPosition(position) && (
              <Circle
                center={position}
                radius={radius}
                options={circleOptions}
              />
            )}
            
            {/* Display property markers */}
            {properties.map(property => (
              <Marker
                key={property.id}
                position={{
                  lat: property.coordinates[0],
                  lng: property.coordinates[1]
                }}
                onClick={() => {
                  setActiveMarker(property.id);
                  // Add animation
                  setMarkerAnimation(null);
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: isLoaded ? new window.google.maps.Size(32, 32) : undefined
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading Google Maps...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPropertySearch;
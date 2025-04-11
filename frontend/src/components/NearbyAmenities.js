import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import "./NearbyAmenities.css";

// Amenity categories with their icons and Google Places types
const amenityCategories = [
  { id: "restaurant", name: "Restaurants", icon: "🍽️", type: "restaurant" },
  { id: "shopping", name: "Shopping", icon: "🛍️", type: "shopping_mall" },
  { id: "hospital", name: "Hospitals", icon: "🏥", type: "hospital" },
  { id: "school", name: "Schools", icon: "🏫", type: "school" },
  { id: "park", name: "Parks", icon: "🌳", type: "park" },
  { id: "transport", name: "Transit", icon: "🚇", type: "transit_station" },
  { id: "grocery", name: "Grocery", icon: "🛒", type: "supermarket" },
  { id: "cafe", name: "Cafes", icon: "☕", type: "cafe" },
  { id: "bank", name: "Banks", icon: "🏦", type: "bank" },
  { id: "pharmacy", name: "Pharmacy", icon: "💊", type: "pharmacy" },
  { id: "gas", name: "Gas", icon: "⛽", type: "gas_station" },
  { id: "atm", name: "ATMs", icon: "💰", type: "atm" },
  { id: "gym", name: "Gyms", icon: "💪", type: "gym" },
  { id: "salon", name: "Salons", icon: "💇", type: "beauty_salon" },
  { id: "movie", name: "Cinemas", icon: "🎬", type: "movie_theater" },
  { id: "airport", name: "Airports", icon: "✈️", type: "airport" }
];

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "400px" // Adjusted to match visible height in screenshot
};

// Default radius for searching amenities (in meters)
const DEFAULT_RADIUS = 5000;
const MAX_RADIUS = 20000;

const NearbyAmenities = ({ coordinates, onNearbyCityUpdate }) => {
  // Convert coordinates to proper format
  const propertyLocation = coordinates && Array.isArray(coordinates) && coordinates.length === 2
    ? { lat: coordinates[0], lng: coordinates[1] }
    : { lat: 20.5937, lng: 78.9629 }; // Default to India's center if not provided
  
  // State for active category, places, and UI
  const [activeCategory, setActiveCategory] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  // Add state for search radius
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  
  // Map and service refs
  const mapRef = useRef(null);
  const placesServiceRef = useRef(null);
  
  // Load the Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"]
  });
  
  // Add state for the nearest airport
  const [nearestAirport, setNearestAirport] = useState(null);
  const [airportDistance, setAirportDistance] = useState(null);
  
  // Add state for nearby cities
  const [nearbyCities, setNearbyCities] = useState([]);
  
  // Add state for transportation hubs
  const [transportHubs, setTransportHubs] = useState({
    busStations: [],
    trainStations: [],
    airports: []
  });
  
  // Add state for hospitals
  const [hospitals, setHospitals] = useState({
    closest: null,
    trusted: null
  });
  
  // Add state for closest bus stop
  const [closestBusStop, setClosestBusStop] = useState(null);
  // Add state for closest mall and train station
  const [closestMall, setClosestMall] = useState(null);
  const [closestTrainStation, setClosestTrainStation] = useState(null);
  
  // Calculate distance between two points in km
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    // Haversine formula to calculate distance between two points on Earth
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };
  
  // Function to find nearby cities
  const findNearbyCities = useCallback(() => {
    if (!placesServiceRef.current) return;
    
    // Search for cities within a larger radius
    const request = {
      location: propertyLocation,
      radius: 50000, // 50km radius to find nearby cities
      type: "locality"
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        // Filter to actual cities and take only the closest one
        const cityResults = results
          .filter(place => place.types && (place.types.includes("locality") || place.types.includes("political")))
          .slice(0, 1); // Only take top 1 nearest city
        
        // Calculate distances
        const citiesWithDistance = cityResults.map(city => {
          try {
            const cityLat = city.geometry.location.lat();
            const cityLng = city.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              cityLat,
              cityLng
            );
            
            return {
              ...city,
              distance: distance
            };
          } catch (error) {
            console.error("Error calculating distance for city:", city.name, error);
            return { ...city, distance: 0 };
          }
        });
        
        if (citiesWithDistance.length > 0) {
          setNearbyCities(citiesWithDistance);
          
          // Notify parent component about the nearby city
          if (onNearbyCityUpdate) {
            onNearbyCityUpdate(citiesWithDistance);
          }
          
          // Find transportation hubs for this city
          findTransportationHubs(citiesWithDistance[0]);
        }
      }
    });
  }, [propertyLocation, calculateDistance, onNearbyCityUpdate]);
  
  // Function to find the nearest airport
  const findNearestAirport = useCallback(() => {
    if (!placesServiceRef.current) return;
    
    console.log("Attempting to find nearest airport from:", propertyLocation);
    
    // Search for airports within a larger radius
    const request = {
      location: propertyLocation,
      radius: 100000, // 100km to find airports
      keyword: "airport", // Simplified keyword
      type: ["airport"] // Use array format which is more reliable
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      console.log("Airport search status:", status);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        console.log("Found airport results:", results);
        
        // Just take the first airport result if any exist
        if (results.length > 0) {
          const airport = results[0];
          try {
            const airportLat = airport.geometry.location.lat();
            const airportLng = airport.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              airportLat,
              airportLng
            );
            
            console.log("Setting nearest airport:", airport.name, "at distance:", distance);
            setNearestAirport(airport);
            setAirportDistance(distance);
          } catch (error) {
            console.error("Error calculating airport distance:", error);
          }
        }
      } else {
        console.log("No airports found or error:", status);
      }
    });
  }, [propertyLocation, calculateDistance]);
  
  // Function to find hospitals
  const findHospitals = useCallback(() => {
    if (!placesServiceRef.current) return;
    
    const request = {
      location: propertyLocation,
      radius: 20000, // 20km radius to find hospitals
      type: "hospital",
      keyword: "hospital"
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        // Process all hospital results with distances
        const hospitalsWithDistance = results.map(hospital => {
          try {
            const hospitalLat = hospital.geometry.location.lat();
            const hospitalLng = hospital.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              hospitalLat,
              hospitalLng
            );
            
            return {
              ...hospital,
              distance: distance
            };
          } catch (error) {
            console.error("Error calculating distance for hospital:", hospital.name, error);
            return { ...hospital, distance: Number.MAX_VALUE };
          }
        });
        
        // Find closest hospital (for emergencies)
        const closest = [...hospitalsWithDistance].sort((a, b) => a.distance - b.distance)[0];
        
        // Find most trusted hospital (best rated with sufficient reviews)
        const trusted = [...hospitalsWithDistance]
          .filter(h => (h.user_ratings_total || 0) > 5) // At least 5 reviews to be considered trusted
          .sort((a, b) => {
            // Sort by rating first
            const ratingDiff = (b.rating || 0) - (a.rating || 0);
            if (Math.abs(ratingDiff) > 0.3) { // If rating difference is significant
              return ratingDiff;
            }
            // For similar ratings, consider the one with more reviews as more reliable
            return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
          })[0] || closest; // Default to closest if no trusted hospital found
        
        setHospitals({
          closest,
          trusted: trusted.place_id !== closest.place_id ? trusted : null // Only show trusted if different from closest
        });
      }
    });
  }, [propertyLocation, calculateDistance]);
  
  // Function to find transportation hubs
  const findTransportationHubs = useCallback((city) => {
    if (!placesServiceRef.current || !city) return;
    
    const cityLocation = {
      lat: city.geometry.location.lat(),
      lng: city.geometry.location.lng()
    };
    
    // Search types
    const transportTypes = [
      { type: "bus_station", category: "busStations" },
      { type: "train_station", category: "trainStations" },
      { type: "airport", category: "airports" }
    ];
    
    // Search for each type of transportation hub
    transportTypes.forEach(({ type, category }) => {
      const request = {
        location: cityLocation,
        radius: 30000, // 30km radius to find major hubs
        type: type
      };
      
      placesServiceRef.current.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Sort by prominence (review count & rating) to get major hubs
          const sortedResults = results.sort((a, b) => {
            // Prioritize places with more reviews
            const aReviews = a.user_ratings_total || 0;
            const bReviews = b.user_ratings_total || 0;
            
            if (bReviews !== aReviews) {
              return bReviews - aReviews; // Higher review count first
            }
            
            // If same review count, compare ratings
            const aRating = a.rating || 0;
            const bRating = b.rating || 0;
            return bRating - aRating;
          });
          
          // Take only the top results (major hubs)
          const majorHubs = sortedResults.slice(0, 2).map(hub => {
            const hubLat = hub.geometry.location.lat();
            const hubLng = hub.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              hubLat,
              hubLng
            );
            
            return {
              ...hub,
              distance: distance
            };
          });
          
          // Update the state with the new hubs
          setTransportHubs(prev => ({
            ...prev,
            [category]: majorHubs
          }));
        }
      });
    });
  }, [propertyLocation, calculateDistance]);
  
  // Function to find the closest bus stop
  const findClosestBusStop = useCallback(() => {
    if (!placesServiceRef.current) return;
    
    const request = {
      location: propertyLocation,
      radius: 3000, // 3km radius to find local bus stops
      type: "bus_station",
      keyword: "bus stop"
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        // Process all bus stop results with distances
        const busStopsWithDistance = results.map(busStop => {
          try {
            const busStopLat = busStop.geometry.location.lat();
            const busStopLng = busStop.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              busStopLat,
              busStopLng
            );
            
            return {
              ...busStop,
              distance: distance
            };
          } catch (error) {
            console.error("Error calculating distance for bus stop:", busStop.name, error);
            return { ...busStop, distance: Number.MAX_VALUE };
          }
        });
        
        // Find closest bus stop
        const closest = [...busStopsWithDistance].sort((a, b) => a.distance - b.distance)[0];
        setClosestBusStop(closest);
      }
    });
  }, [propertyLocation, calculateDistance]);
  
  // Function to find the closest mall
  const findClosestMall = useCallback(() => {
    if (!placesServiceRef.current) return;
    
    const request = {
      location: propertyLocation,
      radius: 10000, // 10km radius to find malls
      type: "shopping_mall",
      keyword: "mall"
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        // Process all mall results with distances
        const mallsWithDistance = results.map(mall => {
          try {
            const mallLat = mall.geometry.location.lat();
            const mallLng = mall.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              mallLat,
              mallLng
            );
            
            return {
              ...mall,
              distance: distance
            };
          } catch (error) {
            console.error("Error calculating distance for mall:", mall.name, error);
            return { ...mall, distance: Number.MAX_VALUE };
          }
        });
        
        // Find closest mall
        const closest = [...mallsWithDistance].sort((a, b) => a.distance - b.distance)[0];
        setClosestMall(closest);
      }
    });
  }, [propertyLocation, calculateDistance]);
  
  // Function to find the closest train station
  const findClosestTrainStation = useCallback(() => {
    if (!placesServiceRef.current) return;
    
    const request = {
      location: propertyLocation,
      radius: 10000, // 10km radius to find train stations
      type: "train_station",
      keyword: "train station"
    };
    
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        // Process all train station results with distances
        const stationsWithDistance = results.map(station => {
          try {
            const stationLat = station.geometry.location.lat();
            const stationLng = station.geometry.location.lng();
            const distance = calculateDistance(
              propertyLocation.lat,
              propertyLocation.lng,
              stationLat,
              stationLng
            );
            
            return {
              ...station,
              distance: distance
            };
          } catch (error) {
            console.error("Error calculating distance for train station:", station.name, error);
            return { ...station, distance: Number.MAX_VALUE };
          }
        });
        
        // Find closest train station
        const closest = [...stationsWithDistance].sort((a, b) => a.distance - b.distance)[0];
        setClosestTrainStation(closest);
      }
    });
  }, [propertyLocation, calculateDistance]);
  
  // Handle map load
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    if (window.google && window.google.maps) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      console.log("Places service initialized");
      
      // Now that the service is initialized, find nearby locations
      if (placesServiceRef.current) {
        findNearbyCities();
        findNearestAirport();
        findHospitals();
        findClosestBusStop();
        findClosestMall();
        findClosestTrainStation();
      }
    }
  }, [findNearbyCities, findNearestAirport, findHospitals, findClosestBusStop, findClosestMall, findClosestTrainStation]);
  
  // Handle map unload
  const onUnmount = useCallback(() => {
    mapRef.current = null;
    placesServiceRef.current = null;
  }, []);
  
  // Handle category click
  const handleCategoryClick = (category) => {
    if (activeCategory && activeCategory.id === category.id) {
      // Deselect if clicking the same category
      setActiveCategory(null);
      setNearbyPlaces([]);
    } else {
      // Select new category and search
      setActiveCategory(category);
      searchNearbyPlaces(category);
    }
  };
  
  // Toggle showing all categories
  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
  };
  
  // Get categories to display
  const displayedCategories = showAllCategories 
    ? amenityCategories 
    : amenityCategories.slice(0, 6);
  
  // Search for nearby places when a category is selected
  const searchNearbyPlaces = useCallback((category) => {
    // Reset states
    setLoading(true);
    setError(null);
    setNearbyPlaces([]);
    setSelectedPlace(null);
    
    // Check if map and places service are available
    if (!placesServiceRef.current) {
      setError("Places service not initialized");
      setLoading(false);
      return;
    }
    
    try {
      // Request parameters
      const request = {
        location: propertyLocation,
        radius: searchRadius, // Use the current radius from slider
        type: category.type
      };
      
      // Set a timeout to prevent getting stuck in loading state
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError("Search timed out. Please try again.");
        }
      }, 10000);
      
      // Perform the search
      placesServiceRef.current.nearbySearch(request, (results, status) => {
        clearTimeout(timeout);
        setLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Use all results without limiting to MAX_RESULTS
          setNearbyPlaces(results);
        } else {
          setNearbyPlaces([]);
          if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setError(`Error searching for places: ${status}`);
          }
        }
      });
    } catch (err) {
      setLoading(false);
      setError(`Failed to search: ${err.message}`);
    }
  }, [propertyLocation, loading, searchRadius]);
  
  // Handle radius change
  const handleRadiusChange = (event) => {
    const newRadius = parseInt(event.target.value, 10);
    setSearchRadius(newRadius);
    
    // If a category is active, re-search with new radius
    if (activeCategory) {
      searchNearbyPlaces(activeCategory);
    }
  };
  
  // Format radius for display
  const formatRadius = (radius) => {
    return (radius / 1000).toFixed(1) + ' km';
  };
  
  // Component initialization
  useEffect(() => {
    console.log("NearbyAmenities component initialized with coordinates:", coordinates);
    console.log("Property location set to:", propertyLocation);
  }, [coordinates, propertyLocation]);
  
  // Find nearby cities when map loads
  useEffect(() => {
    // Places service is set up in onMapLoad, not here
    // We'll rely on onMapLoad to trigger the searches
  }, []);
  
  // Find nearest airport when map loads
  useEffect(() => {
    // Places service is set up in onMapLoad, not here
    // We'll rely on onMapLoad to trigger the searches
  }, []);
  
  // Render error message if Google Maps fails to load
  if (loadError) {
    return (
      <div className="nearby-amenities">
        <h3>Nearby Amenities</h3>
        <div className="error-message">
          Failed to load Google Maps. Please check your internet connection.
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-amenities" style={{
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box',
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      margin: '20px 0'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        padding: '0 0 10px 0', 
        borderBottom: '1px solid #eee' 
      }}>Explore Nearby Amenities</h3>
      
      {/* Amenities row - Fixed layout for Nearest City and Closest Bus Stop */}
      <div className="amenities-row" style={{
        display: 'flex',
        gap: '20px',
        margin: '15px 0',
        width: '100%'
      }}>
        {/* Nearest City Information */}
        {nearbyCities && nearbyCities.length > 0 && (
          <div className="nearby-cities" style={{ 
            flex: '1', 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f0f1ff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Nearest City</h4>
            <div className="city-card single-city" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'transparent'
            }}>
              <span className="city-icon" style={{
                fontSize: '24px',
                backgroundColor: '#e0e2ff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px'
              }}>🏙️</span>
              <div className="city-details" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{nearbyCities[0].name}</strong>
                <p className="city-distance" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                  {nearbyCities[0].distance.toFixed(2)} km
                </p>
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${nearbyCities[0].place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-maps"
                  style={{
                    fontSize: '12px',
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Closest Local Bus Stop */}
        {closestBusStop && (
          <div className="local-bus-stop" style={{ 
            flex: '1', 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f0f1ff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Closest Bus Stop</h4>
            <div className="bus-stop-info" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="bus-stop-icon" style={{
                fontSize: '24px',
                backgroundColor: '#e0e2ff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px'
              }}>🚏</span>
              <div className="bus-stop-details" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{closestBusStop.name}</strong>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>{closestBusStop.vicinity}</p>
                <p className="bus-stop-distance" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                  <span className="distance-value">{closestBusStop.distance.toFixed(2)} km</span>
                  {closestBusStop.distance <= 0.5 && (
                    <span className="walking-info" style={{ marginLeft: '5px', fontSize: '12px', color: '#666' }}>
                      (approx. {Math.round(closestBusStop.distance * 1000 / 80)} min walk)
                    </span>
                  )}
                </p>
                {closestBusStop.rating && (
                  <p className="bus-stop-rating" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                    Rating: {closestBusStop.rating} <span style={{ color: '#FFD700' }}>★</span> 
                    <span style={{ fontSize: '12px', color: '#666' }}>({closestBusStop.user_ratings_total || 0} reviews)</span>
                  </p>
                )}
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${closestBusStop.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-maps"
                  style={{
                    fontSize: '12px',
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '20px', margin: '15px 0' }}>
        {/* Closest Train Station */}
        {closestTrainStation && (
          <div className="local-train-station" style={{ 
            flex: 1, 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f0f1ff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Closest Train Station</h4>
            <div className="train-station-info" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="train-station-icon" style={{
                fontSize: '24px',
                backgroundColor: '#e0e2ff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px'
              }}>🚆</span>
              <div className="train-station-details" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{closestTrainStation.name}</strong>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>{closestTrainStation.vicinity}</p>
                <p className="train-station-distance" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                  <span className="distance-value">{closestTrainStation.distance.toFixed(2)} km</span>
                  {closestTrainStation.distance <= 1 && (
                    <span className="walking-info" style={{ 
                      marginLeft: '5px', 
                      fontSize: '12px', 
                      color: '#666' 
                    }}>
                      (approx. {Math.round(closestTrainStation.distance * 1000 / 80)} min walk)
                    </span>
                  )}
                </p>
                {closestTrainStation.rating && (
                  <p className="train-station-rating" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                    Rating: {closestTrainStation.rating} <span style={{ color: '#FFD700' }}>★</span> 
                    <span style={{ fontSize: '12px', color: '#666' }}>({closestTrainStation.user_ratings_total || 0} reviews)</span>
                  </p>
                )}
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${closestTrainStation.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-maps"
                  style={{
                    fontSize: '12px',
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Closest Mall */}
        {closestMall && (
          <div className="local-mall" style={{ 
            flex: 1, 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f0f1ff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f89406' }}>Closest Mall</h4>
            <div className="mall-info" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="mall-icon" style={{
                fontSize: '24px',
                backgroundColor: '#e0e2ff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px'
              }}>🛍️</span>
              <div className="mall-details" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{closestMall.name}</strong>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>{closestMall.vicinity}</p>
                <p className="mall-distance" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                  <span className="distance-value">{closestMall.distance.toFixed(2)} km</span>
                  {closestMall.distance <= 1 && (
                    <span className="walking-info" style={{ 
                      marginLeft: '5px', 
                      fontSize: '12px', 
                      color: '#666' 
                    }}>
                      (approx. {Math.round(closestMall.distance * 1000 / 80)} min walk)
                    </span>
                  )}
                </p>
                {closestMall.rating && (
                  <p className="mall-rating" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                    Rating: {closestMall.rating} <span style={{ color: '#FFD700' }}>★</span> 
                    <span style={{ fontSize: '12px', color: '#666' }}>({closestMall.user_ratings_total || 0} reviews)</span>
                  </p>
                )}
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${closestMall.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-maps"
                  style={{
                    fontSize: '12px',
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hospitals section */}
      <div className="hospitals-section" style={{ display: 'flex', gap: '20px', margin: '15px 0' }}>
        {/* Closest Hospital (for emergencies) */}
        {hospitals.closest && (
          <div className="local-hospital" style={{ 
            flex: 1, 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f0f1ff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Closest Hospital (For Emergencies)</h4>
            <div className="hospital-info" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="hospital-icon" style={{
                fontSize: '24px',
                backgroundColor: '#e0e2ff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px'
              }}>🏥</span>
              <div className="hospital-details" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{hospitals.closest.name}</strong>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>{hospitals.closest.vicinity}</p>
                <p className="hospital-distance" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                  {hospitals.closest.distance.toFixed(2)} km from property
                  <span className="emergency-badge" style={{ 
                    marginLeft: '8px', 
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#dc3545',
                    fontWeight: '600'
                  }}>Emergency Option</span>
                </p>
                {hospitals.closest.rating && (
                  <p className="hospital-rating" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                    Rating: {hospitals.closest.rating} <span style={{ color: '#FFD700' }}>★</span> 
                    <span style={{ fontSize: '12px', color: '#666' }}>({hospitals.closest.user_ratings_total || 0} reviews)</span>
                  </p>
                )}
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${hospitals.closest.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-maps"
                  style={{
                    fontSize: '12px',
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Most Trusted Hospital (better rated) */}
        {hospitals.trusted && (
          <div className="hospital-trusted" style={{ 
            flex: 1, 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f0f1ff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Highly Rated Hospital</h4>
            <div className="hospital-info" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="hospital-icon" style={{
                fontSize: '24px',
                backgroundColor: '#e0e2ff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px'
              }}>🏥</span>
              <div className="hospital-details" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{hospitals.trusted.name}</strong>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>{hospitals.trusted.vicinity}</p>
                <p className="hospital-distance" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                  {hospitals.trusted.distance.toFixed(2)} km from property
                  <span className="trusted-badge" style={{ 
                    marginLeft: '8px', 
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#28a745',
                    fontWeight: '600'
                  }}>Recommended</span>
                </p>
                {hospitals.trusted.rating && (
                  <p className="hospital-rating" style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                    Rating: {hospitals.trusted.rating} <span style={{ color: '#FFD700' }}>★</span> 
                    <span style={{ fontSize: '12px', color: '#666' }}>({hospitals.trusted.user_ratings_total || 0} reviews)</span>
                  </p>
                )}
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${hospitals.trusted.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-maps"
                  style={{
                    fontSize: '12px',
                    color: '#007bff',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Transportation Hubs */}
      <div className="transportation-hubs" style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <h4 style={{ margin: '0 0 15px 0' }}>Major Transportation Hubs</h4>
        
        {/* Bus Stations */}
        {transportHubs.busStations.length > 0 && (
          <div className="hub-section" style={{
            marginBottom: '20px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h5 style={{ margin: '0 0 10px 0' }}>Bus Stations</h5>
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              marginBottom: '20px',
              width: '100%',
              boxSizing: 'border-box',
              flexWrap: 'wrap'
            }}>
              {transportHubs.busStations.map((station, index) => (
                <div key={index} className="hub-item" style={{ flex: 1, backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <span className="hub-icon">🚌</span>
                  <div className="hub-details">
                    <strong>{station.name}</strong>
                    <p className="hub-distance">
                      {station.distance.toFixed(2)} km from property
                    </p>
                    <a 
                      href={`https://www.google.com/maps/place/?q=place_id:${station.place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-on-maps"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Train Stations */}
        {transportHubs.trainStations.length > 0 && (
          <div className="hub-section">
            <h5>Train Stations</h5>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {transportHubs.trainStations.map((station, index) => (
                <div key={index} className="hub-item" style={{ flex: 1, backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <span className="hub-icon">🚆</span>
                  <div className="hub-details">
                    <strong>{station.name}</strong>
                    <p className="hub-distance">
                      {station.distance.toFixed(2)} km from property
                    </p>
                    <a 
                      href={`https://www.google.com/maps/place/?q=place_id:${station.place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-on-maps"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Airports */}
        {transportHubs.airports.length > 0 && (
          <div className="hub-section">
            <h5>Airports</h5>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {transportHubs.airports.map((airport, index) => (
                <div key={index} className="hub-item" style={{ flex: 1, backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <span className="hub-icon">✈️</span>
                  <div className="hub-details">
                    <strong>{airport.name}</strong>
                    <p className="hub-distance">
                      {airport.distance.toFixed(2)} km from property
                    </p>
                    <a 
                      href={`https://www.google.com/maps/place/?q=place_id:${airport.place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-on-maps"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {transportHubs.busStations.length === 0 && 
         transportHubs.trainStations.length === 0 && 
         transportHubs.airports.length === 0 && (
          <p className="no-hubs-message">No major transportation hubs found nearby.</p>
        )}
      </div>

      {/* Map and Categories Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px', 
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Left sidebar with categories */}
        <div style={{ 
          width: '20%',
          height: '485px', // Matched height
          backgroundColor: '#ffffff',
          borderRight: '1px solid #eaeaea',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <style>
            {`
              .amenity-scroll-container::-webkit-scrollbar {
                width: 6px;
                background: transparent;
              }
              
              .amenity-scroll-container::-webkit-scrollbar-track {
                background: rgba(74, 144, 226, 0.08);
                border-radius: 10px;
              }
              
              .amenity-scroll-container::-webkit-scrollbar-thumb {
                background: #4A90E2;
                border-radius: 10px;
              }
              
              .amenity-scroll-container::-webkit-scrollbar-thumb:hover {
                background: #4A90E2;
              }

              .amenity-category {
                transition: all 0.3s ease;
                transform: translateX(0);
              }

              .amenity-category:hover {
                background-color: rgba(74, 144, 226, 0.1) !important;
                transform: translateX(5px);
                border-color: #4A90E2 !important;
              }
            `}
          </style>
          
          <div className="amenity-scroll-container" style={{
            overflowY: 'auto',
            height: '100%', // Take full height of parent
            padding: '10px',
            scrollBehavior: 'smooth',
            msOverflowStyle: 'none',
            scrollbarWidth: 'thin'
          }}>
            <div className="amenity-categories" style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '8px'
            }}>
              {amenityCategories.map((category) => (
                <button
                  key={category.id}
                  className="amenity-category"
                  onClick={() => handleCategoryClick(category)}
                  disabled={!isLoaded || loading}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center', 
                    justifyContent: 'flex-start',
                    padding: '10px 12px',
                    border: '1px solid #eaeaea',
                    borderRadius: '12px',
                    backgroundColor: activeCategory && activeCategory.id === category.id 
                      ? '#4A90E2' 
                      : '#ffffff',
                    color: activeCategory && activeCategory.id === category.id 
                      ? '#ffffff' 
                      : '#333333',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500',
                    position: 'relative',
                    height: 'auto',
                    boxShadow: activeCategory && activeCategory.id === category.id 
                      ? '0 4px 12px rgba(74, 144, 226, 0.3)'
                      : '0 2px 6px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease',
                    margin: '0'
                  }}
                >
                  <div style={{ 
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    height: '40px',
                    backgroundColor: activeCategory && activeCategory.id === category.id 
                      ? 'rgba(255,255,255,0.2)' 
                      : 'rgba(248,248,248,0.95)',
                    borderRadius: '50%',
                    marginRight: '12px',
                    flexShrink: 0,
                    filter: activeCategory && activeCategory.id === category.id ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' : 'none'
                  }}>{category.icon}</div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    flex: '1',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: activeCategory && activeCategory.id === category.id 
                      ? '0px 0px 2px rgba(0,0,0,0.3)' 
                      : 'none'
                  }}>{category.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right section with map and radius control */}
        <div style={{ width: '80%' }}>
          {/* Map container */}
          <div className="amenities-map-container" style={{
            overflow: 'hidden',
            border: 'none',
            height: '400px' // Fixed height to match map container style
          }}>
            {!isLoaded ? (
              <div className="map-loading" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                background: '#f8f9fa',
                color: '#555',
                fontSize: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#888"/>
                      <path d="M12 4V12L16 16" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  Loading map...
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={propertyLocation}
                zoom={15}
                onLoad={onMapLoad}
                onUnmount={onUnmount}
                options={{
                  fullscreenControl: false,
                  streetViewControl: false,
                  mapTypeControl: true,
                  zoomControl: true,
                  styles: [
                    {
                      featureType: "water",
                      elementType: "geometry",
                      stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
                    },
                    {
                      featureType: "landscape",
                      elementType: "geometry",
                      stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
                    },
                    {
                      featureType: "road.highway",
                      elementType: "geometry.fill",
                      stylers: [{ color: "#ffffff" }, { lightness: 17 }]
                    },
                    {
                      featureType: "road.highway",
                      elementType: "geometry.stroke",
                      stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }]
                    },
                    {
                      featureType: "road.arterial",
                      elementType: "geometry",
                      stylers: [{ color: "#ffffff" }, { lightness: 18 }]
                    },
                    {
                      featureType: "road.local",
                      elementType: "geometry",
                      stylers: [{ color: "#ffffff" }, { lightness: 16 }]
                    },
                    {
                      featureType: "poi",
                      elementType: "geometry",
                      stylers: [{ color: "#f5f5f5" }, { lightness: 21 }]
                    },
                    {
                      featureType: "poi.park",
                      elementType: "geometry",
                      stylers: [{ color: "#dedede" }, { lightness: 21 }]
                    },
                    {
                      elementType: "labels.text.stroke",
                      stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }]
                    },
                    {
                      elementType: "labels.text.fill",
                      stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }]
                    },
                    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                    {
                      featureType: "transit",
                      elementType: "geometry",
                      stylers: [{ color: "#f2f2f2" }, { lightness: 19 }]
                    },
                    {
                      featureType: "administrative",
                      elementType: "geometry.fill",
                      stylers: [{ color: "#fefefe" }, { lightness: 20 }]
                    },
                    {
                      featureType: "administrative",
                      elementType: "geometry.stroke",
                      stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }]
                    }
                  ]
                }}
              >
                {/* Search Radius Circle */}
                {activeCategory && (
                  <Circle
                    center={propertyLocation}
                    radius={searchRadius}
                    options={{
                      fillColor: "rgba(255, 165, 0, 0.15)",
                      fillOpacity: 0.35,
                      strokeColor: "orange",
                      strokeOpacity: 0.8,
                      strokeWeight: 1
                    }}
                  />
                )}
                
                {/* Property marker */}
                <Marker
                  position={propertyLocation}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: new window.google.maps.Size(42, 42)
                  }}
                />
                
                {/* Nearby place markers */}
                {nearbyPlaces.map((place, index) => (
                  <Marker
                    key={place.place_id || index}
                    position={place.geometry.location}
                    onClick={() => setSelectedPlace(place)}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      scaledSize: new window.google.maps.Size(34, 34)
                    }}
                  />
                ))}
                
                {/* Info window for selected place */}
                {selectedPlace && (
                  <InfoWindow
                    position={selectedPlace.geometry.location}
                    onCloseClick={() => setSelectedPlace(null)}
                  >
                    <div className="place-info" style={{
                      padding: '5px',
                      maxWidth: '250px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#333',
                        fontSize: '16px'
                      }}>{selectedPlace.name}</h4>
                      <p style={{ 
                        margin: '0 0 8px 0',
                        color: '#666',
                        fontSize: '13px'
                      }}>{selectedPlace.vicinity}</p>
                      {selectedPlace.rating && (
                        <p style={{ 
                          margin: '0 0 8px 0',
                          color: '#444',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{selectedPlace.rating}</span> 
                          <span style={{ color: '#FFD700', marginRight: '4px' }}>★</span> 
                          <span style={{ color: '#888', fontSize: '12px' }}>
                            ({selectedPlace.user_ratings_total || 0} reviews)
                          </span>
                        </p>
                      )}
                      {selectedPlace.opening_hours && (
                        <p style={{ 
                          margin: '0 0 8px 0',
                          fontSize: '13px',
                          color: selectedPlace.opening_hours.open_now ? '#2E8B57' : '#D32F2F'
                        }}>
                          {selectedPlace.opening_hours.open_now 
                            ? '✅ Open now' 
                            : '❌ Closed'}
                        </p>
                      )}
                      <a 
                        href={`https://www.google.com/maps/place/?q=place_id:${selectedPlace.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: '#1a73e8',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginTop: '5px'
                        }}
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
            
            {/* Loading overlay */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 10
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '50%',
                  borderTop: '4px solid orange',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '10px'
                }}></div>
                <style>
                  {`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}
                </style>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#333'
                }}>Finding nearby {activeCategory ? activeCategory.name.toLowerCase() : 'places'}...</p>
              </div>
            )}
          </div>

          {/* Radius slider below map */}
          <div className="radius-slider-container" style={{ 
            marginTop: '0',
            padding: '10px 15px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #eaeaea',
            height: '85px',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ width: '100%' }}>
              <label htmlFor="radius-slider" className="radius-slider-label" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '13px',
                width: '100%'
              }}>
                <span>Search Radius:</span>
                <span className="radius-value" style={{
                  color: 'orange',
                  fontWeight: '700',
                  fontSize: '13px',
                  background: 'rgba(255, 165, 0, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  minWidth: '56px',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>{formatRadius(searchRadius)}</span>
              </label>
            </div>
            
            <div style={{ width: '100%', position: 'relative', height: '20px' }}>
              <input 
                type="range" 
                id="radius-slider" 
                className="radius-slider" 
                min="1000" 
                max={MAX_RADIUS} 
                step="1000" 
                value={searchRadius} 
                onChange={handleRadiusChange} 
                disabled={loading || !isLoaded}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  WebkitAppearance: 'none',
                  background: 'linear-gradient(to right, orange, #FF8C00)',
                  outline: 'none',
                  cursor: 'pointer',
                  margin: '0',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '8px'
                }}
              />
              <style>
                {`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid orange;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    cursor: pointer;
                  }
                  
                  input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid orange;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    cursor: pointer;
                  }
                `}
              </style>
            </div>
            
            <div className="radius-labels" style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#666',
              fontSize: '11px',
              fontWeight: '500',
              width: '100%',
              paddingTop: '4px'
            }}>
              <span>1 km</span>
              <span>{MAX_RADIUS/1000} km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results information */}
      {error && <div className="amenity-error">{error}</div>}
      
      {activeCategory && !loading && !error && (
        <div className="results-count">
          {nearbyPlaces.length === 0 ? (
            <p>No {activeCategory.name.toLowerCase()} found nearby</p>
          ) : (
            <p>Showing {nearbyPlaces.length} closest {activeCategory.name.toLowerCase()}</p>
          )}
        </div>
      )}
      
      {!activeCategory && !loading && (
        <div className="amenity-instructions">
          <p>Select a category above to see nearby amenities</p>
        </div>
      )}
      
      <p className="amenities-note">
        *Showing all places within {formatRadius(searchRadius)}. Data provided by Google Places.
      </p>
    </div>
  );
};

export default NearbyAmenities;
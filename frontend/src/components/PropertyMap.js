import React, { useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

// Default map container style
const containerStyle = {
  width: '100%',
  height: '300px'
};

const PropertyMap = ({ coordinates }) => {
  const center = coordinates 
    ? { lat: coordinates[0], lng: coordinates[1] } 
    : { lat: 20.5937, lng: 78.9629 }; // Default to India's center

  // Load the Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [map, setMap] = React.useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (!coordinates) {
    return <div className="property-map-placeholder">No location available</div>;
  }

  return (
    <div className="property-map">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true
          }}
        >
          <Marker
            position={center}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }}
          />
        </GoogleMap>
      ) : (
        <div>Loading Map...</div>
      )}
    </div>
  );
};

export default PropertyMap; 
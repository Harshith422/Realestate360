import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropertyLocationPicker from "../components/PropertyLocationPicker";
import "../styles.css";
import "../styles/MapPropertySearch.css";
import "../styles/MapSearch.css";

const styles = `
.property-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.name-price-container {
  display: flex;
  gap: 20px;
  grid-column: span 2;
  width: 100%;
}

.name-price-container .form-group {
  flex: 1;
  margin: 0;
}

.form-group {
  margin-bottom: 15px;
  width: 100%;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input[type="number"] {
  width: 100%;
  -moz-appearance: textfield;
}

.form-group input[type="number"]::-webkit-outer-spin-button,
.form-group input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Location field styling */
.location-form-group {
  margin-bottom: 10px;
}

.location-field-container {
  margin-bottom: 10px;
}

.location-help-text {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 5px;
  font-style: italic;
}

/* Make sure the map marker is visible */
.map-property-search .gm-style img[src*="red-dot.png"] {
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7)) !important;
  opacity: 1 !important;
}

/* Make the read-only location input look different */
input[name="location"][readonly] {
  background-color: #f8f9fa;
  cursor: default;
  border: 1px solid #ced4da;
}

.flat-fields-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  grid-column: span 2;
  width: 100%;
  margin-bottom: 0;
}

.flat-fields-container .form-group {
  flex: 1;
  margin: 0;
  width: calc(33.33% - 14px);
}

.flat-fields-container input {
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .flat-fields-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .flat-fields-container .form-group {
    width: 100%;
  }
}

.image-upload-container {
  grid-column: span 2;
  border: 2px dashed #ddd;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  background: #f9f9f9;
  cursor: pointer;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.preview-image-container {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.preview-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-delete {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  color: #ff4444;
}

.upload-button-container {
  grid-column: span 2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.upload-button {
  background: linear-gradient(145deg, #4A90E2, #5DA9E9);
  color: white;
  padding: 15px 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: auto;
  min-width: 200px;
  display: inline-block;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
  text-align: center;
}

.upload-button:hover {
  background: linear-gradient(145deg, #5DA9E9, #4A90E2);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.upload-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.upload-property-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.upload-property-page .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.upload-property-page .page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.cancel-button {
  background-color: #f1f1f1;
  color: #333;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  text-decoration: none;
  display: inline-block;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}
`;

const UploadProperty = ({ isLoggedIn, authToken, userEmail }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    coordinates: null,
    propertyType: "flat",
    area: "",
    bedrooms: "",
    bathrooms: "",
    landArea: "",
    landType: "residential",
    legalClearance: ""
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [previewImages, setPreviewImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  
  // Add file input ref
  const fileInputRef = useRef(null);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    // Initialize the form with default coordinates if not set
    if (!formData.coordinates) {
      console.log("Initializing default coordinates");
      setFormData(prev => ({
        ...prev,
        coordinates: [20.5937, 78.9629] // Default coordinates for India
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (files.length + previewImages.length > 10) {
      setMessage({ text: "You can only upload up to 10 images in total", type: "error" });
      return;
    }
    
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setImageFiles(prev => [...prev, ...imageFiles]);
    
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelected = (coords, address) => {
    console.log("Location selected in UploadProperty:", coords, address);
    
    if (!coords) {
      console.log("No coordinates provided, only updating address");
      setFormData(prev => ({
        ...prev,
        location: address || ""
      }));
      return;
    }
    
    // Make sure coords is always an array [lat, lng]
    const coordsArray = Array.isArray(coords) ? coords : [coords.lat, coords.lng];
    
    console.log("Updating coordinates to:", coordsArray);
    console.log("Updating address to:", address);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      coordinates: coordsArray,
      location: address || ""
    }));
    
    // Force a re-render, but don't scroll
    setMapKey(Date.now());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const data = new FormData();
      
      // Add owner email
      data.append("ownerEmail", userEmail);
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "" && formData[key] !== null) {
          // Convert coordinates array to JSON string
          if (key === 'coordinates' && Array.isArray(formData[key])) {
            data.append(key, JSON.stringify(formData[key]));
          } else {
            data.append(key, formData[key]);
          }
        }
      });
      
      // Add image files
      imageFiles.forEach(file => {
        data.append("images", file);
      });

      const url = "http://localhost:5000/properties/upload";
      
      console.log('Sending request to:', url);
      console.log('Form data entries:', [...data.entries()]);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: data
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(errorText || 'Failed to upload property');
      }

      const result = await response.json();
      setMessage({ 
        text: "Property uploaded successfully!", 
        type: "success" 
      });

      // Clear form
      setFormData({
        name: "",
        description: "",
        price: "",
        location: "",
        coordinates: null,
        propertyType: "flat",
        area: "",
        bedrooms: "",
        bathrooms: "",
        landArea: "",
        landType: "residential",
        legalClearance: ""
      });
      setImageFiles([]);
      setPreviewImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Dispatch event to refresh property list
      window.dispatchEvent(new CustomEvent('propertyUploaded'));

      // Navigate back to properties page after short delay
      setTimeout(() => {
        navigate("/properties");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: error.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up preview URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  if (isLoading) {
    return (
      <div className="loading-profile">
        <div className="loading-spinner-profile"></div>
        <div className="loading-text-profile">Uploading Property</div>
        <div className="loading-subtext-profile">Please wait while we process your request...</div>
      </div>
    );
  }

  return (
    <div className="upload-property-page">
      <style>{styles}</style>
      
      <div className="page-header">
        <h1>ADD NEW PROPERTY</h1>
        <button 
          className="cancel-button" 
          onClick={() => navigate("/properties")}
        >
          Cancel
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="property-form">
        <div className="name-price-container">
          <div className="form-group">
            <label htmlFor="name">Property Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter property name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price (₹)</label>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="Enter property price"
            />
          </div>
        </div>
        
        <div className="form-group full-width">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Describe the property features, amenities, etc."
            rows="4"
          ></textarea>
        </div>
        
        <div className="form-group full-width location-form-group">
          <label htmlFor="map-location">Property Location</label>
          <div className="location-field-container">
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Search for property location or click on map"
              readOnly={formData.coordinates !== null} // Only make it read-only if we have coordinates
            />
            <small className="location-help-text">
              {formData.coordinates 
                ? "Location will update automatically when you select a place on the map" 
                : "Enter the property location or use the map below if available"}
            </small>
          </div>
          <div onSubmit={(e) => e.preventDefault()}>
            <PropertyLocationPicker 
              key={mapKey}
              userPosition={formData.coordinates} 
              onLocationSelected={handleLocationSelected}
            />
          </div>
        </div>
        
        {/* Add a manual location section that shows only when we have an issue with the map */}
        {!formData.coordinates && (
          <div className="form-group">
            <label htmlFor="manual-location">Enter location manually</label>
            <input
              type="text"
              id="manual-location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter complete property address"
            />
            <small className="location-help-text">
              You can type the property location manually if the map isn't working
            </small>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="propertyType">Property Type</label>
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            required
          >
            <option value="flat">Flat</option>
            <option value="land">Land</option>
          </select>
        </div>
        
        {/* Property specific fields */}
        {formData.propertyType === "flat" && (
          <div className="flat-fields-container">
            <div className="form-group">
              <label htmlFor="area">Area (sq. ft.)</label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                placeholder="Size of the flat"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bedrooms">Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                required
                min="0"
                placeholder="Number of bedrooms"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bathrooms">Bathrooms</label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                onChange={handleChange}
                value={formData.bathrooms}
                required
                min="0"
                placeholder="Number of bathrooms"
              />
            </div>
          </div>
        )}
        
        {formData.propertyType === "land" && (
          <>
            <div className="land-fields-container">
              <div className="land-fields-row">
                <div className="form-group">
                  <label htmlFor="landArea">Total Land Area</label>
                  <input
                    type="text"
                    id="landArea"
                    name="landArea"
                    value={formData.landArea}
                    onChange={handleChange}
                    required
                    placeholder="Size of the land (sq. ft. or acres)"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="landType">Land Type</label>
                  <select
                    id="landType"
                    name="landType"
                    value={formData.landType}
                    onChange={handleChange}
                    required
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="agricultural">Agricultural</option>
                    <option value="industrial">Industrial</option>
                    <option value="mixed-use">Mixed-Use</option>
                  </select>
                </div>
              </div>
              
              <div className="legal-clearance-container">
                <div className="form-group">
                  <label htmlFor="legalClearance">Legal Clearance</label>
                  <textarea
                    id="legalClearance"
                    name="legalClearance"
                    value={formData.legalClearance}
                    onChange={handleChange}
                    required
                    placeholder="Any legal approvals or land documents"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div className="form-group full-width">
          <div 
            className={`image-upload-container ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              id="image-upload"
              name="images"
              onChange={(e) => handleFiles(Array.from(e.target.files))}
              accept="image/*"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <span className="upload-icon">📸</span>
            <p>Drop your property images here or click to browse</p>
            <small>Supported formats: JPG, PNG, WEBP • Max 10 images</small>
          </div>
          
          {previewImages.length > 0 && (
            <div className="image-preview-grid">
              {previewImages.map((url, index) => (
                <div key={index} className="preview-image-container">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button 
                    type="button" 
                    className="preview-delete"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="upload-button-container">
          <button type="submit" className="upload-button" disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload Property"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadProperty; 
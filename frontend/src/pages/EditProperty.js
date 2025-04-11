import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropertyLocationPicker from "../components/PropertyLocationPicker";
import "../styles/EditProperty.css";
import "../styles/MapPropertySearch.css";

const EditProperty = ({ isLoggedIn, authToken, userEmail }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const fileInputRef = useRef(null);
  
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
  const [previewImages, setPreviewImages] = useState([]);

  // Fetch property data if editing
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/properties/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch property data');
        }
        const data = await response.json();
        setFormData({
          name: data.name || "",
          description: data.description || "",
          price: data.price || "",
          location: data.location || "",
          coordinates: data.coordinates || null,
          propertyType: data.propertyType || "flat",
          area: data.area || "",
          bedrooms: data.bedrooms || "",
          bathrooms: data.bathrooms || "",
          landArea: data.landArea || "",
          landType: data.landType || "residential",
          legalClearance: data.legalClearance || ""
        });
        
        // If there are existing images, set them as previews
        if (data.images && data.images.length > 0) {
          setPreviewImages(data.images);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching property:', error);
        setMessage({ text: "Failed to load property data", type: "error" });
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchPropertyData();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    processSelectedFiles(files);
  };
  
  const processSelectedFiles = (files) => {
    // Filter out non-image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Create preview URLs
    const newPreviewImages = imageFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...imageFiles]);
    setPreviewImages(prev => [...prev, ...newPreviewImages]);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processSelectedFiles(files);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const data = new FormData();
      
      // Add all form fields
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
      
      // Add owner email
      data.append("ownerEmail", userEmail);
      
      // Add new images
      imageFiles.forEach(file => {
        data.append("images", file);
      });

      // Add existing images
      const existingImages = previewImages.filter(url => !url.startsWith('blob:'));
      data.append("existingImages", JSON.stringify(existingImages));

      // Send PUT request to update endpoint
      const response = await fetch(`http://localhost:5000/properties/${id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: data
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Failed to update property");
      }

      // Parse response
      const result = await response.json();
      setMessage({ text: "Property updated successfully!", type: "success" });
      
      // Dispatch event to refresh property list
      window.dispatchEvent(new CustomEvent('propertyUploaded'));
      
      // Navigate back to property details
      setTimeout(() => {
        navigate(`/property/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating property:', error);
      setMessage({ text: error.message || "Failed to update property", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, navigate]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="edit-property-container">
      <h1>Edit Property</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-property-form">
        <div className="name-price-row">
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
            placeholder="Describe the property in detail with features, amenities, and surroundings"
            rows="4"
          ></textarea>
        </div>

        <div className="property-type-area-row">
          <div className="form-group">
            <label htmlFor="propertyType">Property Type</label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
            >
              <option value="flat">Flat/Apartment</option>
              <option value="house">House/Villa</option>
              <option value="plot">Plot/Land</option>
              <option value="commercial">Commercial Property</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="area">Carpet Area (sq.ft)</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Enter carpet area"
            />
          </div>
        </div>

        {formData.propertyType !== 'plot' && (
          <div className="bedrooms-bathrooms-row">
            <div className="form-group">
              <label htmlFor="bedrooms">Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="Number of bedrooms"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bathrooms">Bathrooms</label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                placeholder="Number of bathrooms"
              />
            </div>
          </div>
        )}

        {formData.propertyType === 'plot' && (
          <>
            <div className="form-group">
              <label htmlFor="landArea">Land Area (sq.ft)</label>
              <input
                type="number"
                id="landArea"
                name="landArea"
                value={formData.landArea}
                onChange={handleChange}
                placeholder="Enter land area"
              />
            </div>

            <div className="form-group">
              <label htmlFor="landType">Land Type</label>
              <select
                id="landType"
                name="landType"
                value={formData.landType}
                onChange={handleChange}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="legalClearance">Legal Clearance Details</label>
              <textarea
                id="legalClearance"
                name="legalClearance"
                value={formData.legalClearance}
                onChange={handleChange}
                placeholder="Enter legal clearance details, approvals, etc."
                rows="3"
              ></textarea>
            </div>
          </>
        )}

        <div className="form-group full-width location-form-group">
          <label htmlFor="map-location">Property Location</label>
          <div className="location-field-container">
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Property location address"
              readOnly
            />
          </div>
          
          <div className="location-help-text">
            <p><strong>📍 How to set your property location:</strong></p>
            <ul>
              <li>Search for your area in the map below</li>
              <li>Navigate to the exact property location</li>
              <li>Click to place the marker</li>
              <li>Drag the marker to fine-tune the location</li>
            </ul>
          </div>
          
          <PropertyLocationPicker
            setFormLocation={(location, coordinates) => {
              setFormData({
                ...formData,
                location: location,
                coordinates: coordinates
              });
            }}
            initialLocation={formData.location}
            initialCoordinates={formData.coordinates}
          />
        </div>

        <div className="form-group full-width">
          <label>Property Images</label>
          <div 
            className="image-upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="upload-instructions">
              <div className="upload-icon">📸</div>
              <h3>Upload Property Images</h3>
              <p>Click or drag and drop images here</p>
              <small>Supported formats: JPG, PNG, WEBP. Max 10MB per image.</small>
            </div>
            <button 
              type="button" 
              className="upload-btn"
              onClick={() => fileInputRef.current.click()}
            >
              <span>📤</span> Select Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
              accept="image/*"
              multiple
            />
          </div>
          
          {previewImages.length > 0 && (
            <div className="image-preview-container">
              {previewImages.map((previewUrl, index) => (
                <div key={index} className="image-preview-item">
                  <img
                    src={previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="image-preview"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(`/property/${id}`)}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Property'}
            {!isLoading && <span>✓</span>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProperty; 
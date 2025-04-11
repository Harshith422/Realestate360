import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppointmentsList from "../components/AppointmentsList";
import "../styles.css";

const ProfilePage = ({ isLoggedIn, authToken, userEmail }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, properties, myAppointments, visitRequests
  const navigate = useNavigate();
  
  // Profile information states
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    address: "",
    occupation: "",
    bio: ""
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Add a ref for the file input
  const fileInputRef = useRef(null);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      fetchUserProfile();
      fetchUserProperties();
    }
  }, [isLoggedIn, navigate, authToken]);

  // Fetch user profile data from backend
  const fetchUserProfile = async () => {
    if (!isLoggedIn || !authToken) return;
    
    setProfileLoading(true);
    try {
      const response = await fetch("http://localhost:5000/users/profile", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }
      
      const data = await response.json();
      setProfileData({
        fullName: data.fullName || "",
        phone: data.phone || "",
        address: data.address || "",
        occupation: data.occupation || "",
        bio: data.bio || ""
      });
      
      if (data.profileImage) {
        setImagePreview(data.profileImage);
      }
      
      setProfileError(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfileError("Failed to load your profile. Please try again later.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch user's properties
  const fetchUserProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/properties");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      
      // Filter properties to only include those owned by the current user
      const userProperties = data.filter(property => property.ownerEmail === userEmail);
      setProperties(userProperties);
      setError(null);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to load your properties. Please try again later.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // Listen for property upload events to refresh the list
      const handlePropertyUploaded = () => {
        fetchUserProperties();
      };

      window.addEventListener('propertyUploaded', handlePropertyUploaded);
      window.addEventListener('propertyDeleted', handlePropertyUploaded);

      return () => {
        window.removeEventListener('propertyUploaded', handlePropertyUploaded);
        window.removeEventListener('propertyDeleted', handlePropertyUploaded);
      };
    }
  }, [isLoggedIn, userEmail]);

  useEffect(() => {
    if (isLoggedIn && authToken) {
      // Attempt to migrate existing appointments data if needed
      const migrateAppointments = async () => {
        try {
          // Only attempt migration once
          const migrationAttempted = localStorage.getItem('appointmentsMigrationAttempted');
          if (migrationAttempted) return;
          
          const response = await fetch('http://localhost:5000/appointments/migrate-roles', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Mark as attempted regardless of success
          localStorage.setItem('appointmentsMigrationAttempted', 'true');
          
          if (!response.ok) {
            console.log('Migration endpoint not available or unauthorized - this is normal for most users');
            return;
          }
          
          const result = await response.json();
          console.log('Appointment migration result:', result);
        } catch (error) {
          console.log('Appointment migration failed, this is normal for most users:', error);
        }
      };
      
      migrateAppointments();
    }
  }, [isLoggedIn, authToken]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !authToken) return;
    
    setProfileLoading(true);
    setUpdateSuccess(false);
    
    try {
      const formData = new FormData();
      
      // Append text data
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
      
      // Append profile image if there is one
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      
      const response = await fetch("http://localhost:5000/users/profile", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(await response.text() || "Failed to update profile");
      }
      
      const result = await response.json();
      setProfileError(null);
      setUpdateSuccess(true);
      setIsEditingProfile(false);
      
      // Reset the file input using the ref instead of direct DOM manipulation
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setProfileImage(null);
      
      // Show success message temporarily
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const deleteProperty = async (propertyId) => {
    if (!isLoggedIn || !authToken) {
      console.error("Must be logged in to delete a property");
      return;
    }

    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      try {
        const response = await fetch(`http://localhost:5000/properties/${propertyId}`, {
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

        // Remove property from local state
        setProperties(properties.filter(p => p.id !== propertyId));
        
        // Dispatch event to notify of deletion
        window.dispatchEvent(new CustomEvent('propertyDeleted'));
        
        alert("Property deleted successfully");
      } catch (error) {
        console.error("Error deleting property:", error);
        alert(`Failed to delete property: ${error.message}`);
      }
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Account</h1>
        <div className="user-info">
          <span className="user-email-display">
            <i className="far fa-user user-icon"></i> 
            {userEmail}
          </span>
        </div>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          My Properties
        </button>
        <button 
          className={`tab-button ${activeTab === 'myAppointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('myAppointments')}
        >
          My Appointments
        </button>
        <button 
          className={`tab-button ${activeTab === 'visitRequests' ? 'active' : ''}`}
          onClick={() => setActiveTab('visitRequests')}
        >
          Visit Requests
        </button>
      </div>
      
      {activeTab === 'profile' && (
        <div className="profile-information-section">
          <div className="section-header">
            <h2>Profile Information</h2>
            {!isEditingProfile && (
              <button 
                className="btn-edit"
                onClick={() => setIsEditingProfile(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          
          {updateSuccess && (
            <div className="success-message">
              Profile updated successfully!
            </div>
          )}
          
          {profileError && (
            <div className="error-message">
              {profileError}
            </div>
          )}
          
          {profileLoading ? (
            <div className="loading">Loading profile information...</div>
          ) : (
            isEditingProfile ? (
              <form className="profile-form" onSubmit={handleSubmitProfile}>
                <div className="profile-image-upload">
                  <div className="current-image">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile Preview" 
                        className="profile-image-preview" 
                      />
                    ) : (
                      <div className="profile-image-placeholder">
                        <i className="fas fa-user-circle large-icon"></i>
                      </div>
                    )}
                  </div>
                  <label className="image-upload-label" htmlFor="profile-image-upload">
                    <i className="fas fa-camera"></i> Change Photo
                  </label>
                  <input 
                    type="file" 
                    id="profile-image-upload" 
                    className="hidden-input"
                    accept="image/*" 
                    onChange={handleImageChange}
                    ref={fileInputRef}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    placeholder="Your address"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={profileData.occupation}
                    onChange={handleProfileChange}
                    placeholder="Your occupation"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">About Me</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell us a bit about yourself"
                    rows="4"
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={profileLoading}
                  >
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-display">
                <div className="profile-image-section">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="profile-image" 
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      <i className="fas fa-user-circle"></i>
                    </div>
                  )}
                </div>
                
                <div className="profile-details">
                  {profileData.fullName && (
                    <h3 className="profile-name">{profileData.fullName}</h3>
                  )}
                  
                  {(profileData.fullName || profileData.phone || profileData.address || profileData.occupation) ? (
                    <>
                      {profileData.phone && (
                        <div className="profile-detail-row">
                          <span className="detail-label">Phone:</span>
                          <span className="detail-value">{profileData.phone}</span>
                        </div>
                      )}
                      
                      {profileData.address && (
                        <div className="profile-detail-row">
                          <span className="detail-label">Address:</span>
                          <span className="detail-value">{profileData.address}</span>
                        </div>
                      )}
                      
                      {profileData.occupation && (
                        <div className="profile-detail-row">
                          <span className="detail-label">Occupation:</span>
                          <span className="detail-value">{profileData.occupation}</span>
                        </div>
                      )}
                      
                      {profileData.bio && (
                        <div className="profile-bio">
                          <h4>About Me</h4>
                          <p className="bio-text">{profileData.bio}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-profile-message">
                      <p>Your profile is empty. Click "Edit Profile" to add your information.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
      
      {activeTab === 'properties' && (
        <div className="user-properties-section">
          <div className="section-header">
            <h2>My Properties</h2>
            <Link to="/properties?upload=true" className="btn-add">
              {properties.length > 0 ? "Add More Properties" : "Add Your First Property"}
            </Link>
          </div>
          
          {loading ? (
            <div className="loading">Loading your properties...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : properties.length === 0 ? (
            <div className="no-data">
              <p>You haven't uploaded any properties yet.</p>
            </div>
          ) : (
            <div className="property-listings">
              {properties.map(property => (
                <div key={property.id} className="property-listing-card">
                  <div className="property-image">
                    {property.image ? (
                      <img src={property.image} alt={property.name} />
                    ) : property.images && property.images.length > 0 ? (
                      <img src={property.images[0]} alt={property.name} />
                    ) : (
                      <div className="no-image-placeholder">No Image Available</div>
                    )}
                    <div className="property-type-tag" style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      backgroundColor: '#4A90E2',
                      color: 'white',
                      padding: '6px 15px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      zIndex: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {property.propertyType === "flat" ? "Flat" : "Land"}
                    </div>
                  </div>
                  
                  <div className="property-details">
                    <h3 className="property-title">{property.name}</h3>
                    <p className="property-location">
                      <i className="fas fa-map-marker-alt"></i> {property.location}
                    </p>
                    <p className="property-price">{property.price}</p>
                    
                    {property.propertyType === "flat" && (
                      <div className="property-features">
                        {property.bedrooms && (
                          <span className="feature"><i className="fas fa-bed"></i> {property.bedrooms} Bed</span>
                        )}
                        {property.bathrooms && (
                          <span className="feature"><i className="fas fa-bath"></i> {property.bathrooms} Bath</span>
                        )}
                        {property.area && (
                          <span className="feature"><i className="fas fa-vector-square"></i> {property.area}</span>
                        )}
                      </div>
                    )}
                    
                    {property.propertyType === "land" && (
                      <div className="property-features">
                        {property.landArea && (
                          <span className="feature"><i className="fas fa-vector-square"></i> {property.landArea}</span>
                        )}
                        {property.landType && (
                          <span className="feature"><i className="fas fa-landmark"></i> {property.landType}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="property-card-actions">
                      <Link to={`/property/${property.id}`} className="btn-view">View Details</Link>
                      <button 
                        className="btn-delete"
                        onClick={() => deleteProperty(property.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'myAppointments' && (
        <AppointmentsList 
          authToken={authToken} 
          userType="user" 
          userEmail={userEmail}
        />
      )}
      
      {activeTab === 'visitRequests' && (
        <AppointmentsList 
          authToken={authToken} 
          userType="owner" 
          userEmail={userEmail}
        />
      )}
    </div>
  );
};

export default ProfilePage; 
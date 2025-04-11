import React, { useState } from 'react';
import '../styles/Profile.css';

const Profile = () => {
  const userProfile = {
    name: "Harshith",
    username: "harshith_official",
    phone: "7013704561",
    address: "F-305,serene block,gajuwaka",
    occupation: "Property Consultant",
    about: "Finding your perfect home is my passion. | Real Estate Enthusiast | Travel Lover | Coffee Addict",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1170&auto=format&fit=crop",
    followers: 856,
    following: 342,
    posts: 28
  };

  
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className="pro-profile-container">
      <div className="pro-profile-card">
        <div className="pro-profile-header">
          <h1>PROFILE INFORMATION</h1>
          <button className="pro-edit-button">Edit Profile</button>
        </div>
        
        <div className="pro-profile-content">
          <div className="pro-profile-image-section">
            <div className="pro-profile-image-container">
              <img 
                src={userProfile.image} 
                alt={userProfile.name} 
                className="pro-profile-image"
              />
            </div>
            <h2 className="pro-profile-name">{userProfile.name}</h2>
            <div className="pro-profile-divider"></div>
          </div>
          
          <div className="pro-profile-info-grid">
            <div className="pro-info-row">
              <div className="pro-info-label">Phone:</div>
              <div className="pro-info-value">{userProfile.phone}</div>
            </div>
            
            <div className="pro-info-row">
              <div className="pro-info-label">Address:</div>
              <div className="pro-info-value">{userProfile.address}</div>
            </div>
            
            <div className="pro-info-row">
              <div className="pro-info-label">Occupation:</div>
              <div className="pro-info-value">{userProfile.occupation}</div>
            </div>
          </div>
          
          <div className="pro-about-section">
            <h3 className="pro-about-title">About Me</h3>
            <div className="pro-about-content">
              {userProfile.about || "No information provided."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
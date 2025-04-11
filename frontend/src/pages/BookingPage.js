import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const BookingPage = ({ isLoggedIn, authToken, userEmail }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    message: "",
  });
  const [profileComplete, setProfileComplete] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user profile is complete when component mounts
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!isLoggedIn || !authToken) return;
      
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/users/profile", {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error("Failed to check user profile");
        }
        
        const profileData = await response.json();
        
        // Check if required profile fields are filled
        const isComplete = profileData.fullName && 
                           profileData.phone && 
                           profileData.address;
        
        setProfileComplete(isComplete);
        if (!isComplete) {
          console.log("Profile incomplete - missing required fields");
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        setError("Unable to verify profile completeness. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    checkUserProfile();
  }, [isLoggedIn, authToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // First check if user is logged in
    if (!isLoggedIn) {
      alert("You must be logged in to book an appointment.");
      navigate("/login");
      return;
    }
    
    // Then check if profile is complete
    if (!profileComplete) {
      alert("Please complete your profile before booking an appointment.");
      navigate("/profile");
      return;
    }
    
    // Proceed with booking
    alert("Appointment booked successfully!");
  };

  return (
    <div className="booking-container">
      <h2>Book an Appointment</h2>
      
      {loading && <p className="loading-message">Loading profile information...</p>}
      
      {error && <p className="error-message">{error}</p>}
      
      {!profileComplete && (
        <div className="profile-warning">
          <p>⚠️ Your profile is incomplete. Please add your name, phone number, and address before booking.</p>
          <button onClick={() => navigate("/profile")} className="btn btn-secondary">
            Complete Profile
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="booking-form">
        <input type="date" name="date" onChange={handleChange} required />
        <input type="time" name="time" onChange={handleChange} required />
        <textarea
          name="message"
          placeholder="Message (Optional)"
          onChange={handleChange}
        ></textarea>
        <button type="submit" className="btn" disabled={!isLoggedIn || !profileComplete}>
          Book Now
        </button>
      </form>
    </div>
  );
};

export default BookingPage;

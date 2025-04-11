import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const BookingForm = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ date: "", time: "", message: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!formData.date || !formData.time) {
      setError("Please select a valid date and time.");
      return;
    }

    alert("✅ Appointment booked successfully!");
    setFormData({ date: "", time: "", message: "" });
    setError("");
  };

  return (
    <div className="booking-form">
      <h2>📅 Book an Appointment</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        <input type="time" name="time" value={formData.time} onChange={handleChange} required />
        <textarea name="message" placeholder="Message (Optional)" value={formData.message} onChange={handleChange}></textarea>
        <button type="submit" className="btn">Book Now</button>
      </form>
    </div>
  );
};

export default BookingForm;

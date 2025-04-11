import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";
import "./ChatInterface.css";

const ChatInterface = ({ propertyId, userEmail, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [preferredAppointments, setPreferredAppointments] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [currentStep, setCurrentStep] = useState("initial"); // initial, selectDate, selectTime, message, complete
  const [selectedDate, setSelectedDate] = useState(null);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [isPhoneAvailable, setIsPhoneAvailable] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [propertyData, setPropertyData] = useState(null);
  
  // Ref for chat messages container for auto-scrolling
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Generate available dates for the next 30 days
  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    setAvailableDates(dates);
  }, []);

  // Generate time slots from 9 AM to 6 PM
  useEffect(() => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour}:00`);
      if (hour < 18) {
        slots.push(`${hour}:30`);
      }
    }
    setTimeSlots(slots);
  }, []);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    const email = localStorage.getItem("userEmail");
    if (token && email) {
      setIsLoggedIn(true);
      setAuthToken(token);
      checkUserProfileCompletion();
    } else {
      setMessages([
        {
          type: "system",
          text: "You need to be logged in to book an appointment. Please login first.",
          options: [
            { id: "login", text: "Login" }
          ]
        }
      ]);
    }
  }, []);
  
  // Auto-scroll to the bottom whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus on message input when it appears
  useEffect(() => {
    if (currentStep === "message" && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [currentStep]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // New function to check user profile and show reminder if needed
  const checkUserProfileCompletion = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessages([
          {
            type: "system",
            text: "You need to be logged in to book an appointment. Please login first.",
            options: [
              { id: "login", text: "Login" }
            ]
          }
        ]);
        return;
      }

      const response = await fetch("http://localhost:5000/users/profile", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("authToken");
          localStorage.removeItem("userEmail");
          setMessages([
            {
              type: "system",
              text: "Your session has expired. Please login again.",
              options: [
                { id: "login", text: "Login" }
              ]
            }
          ]);
          return;
        }
        throw new Error("Failed to check user profile");
      }
      
      const profileData = await response.json();
      
      // Check if required profile fields are filled
      const isProfileComplete = profileData.fullName && 
                               profileData.phone && 
                               profileData.address;
      
      // Set initial message with profile reminder if needed
      if (!isProfileComplete) {
        setMessages([
          {
            type: "system",
            text: "⚠️ Please note: You need to complete your profile (name, phone, and address) before booking an appointment.",
          },
          {
            type: "system",
            text: "Would you like to:",
            options: [
              { id: "schedule", text: "Continue scheduling (profile can be completed later)" },
              { id: "profile", text: "Complete my profile first" }
            ]
          }
        ]);
      } else {
        setMessages([
          {
            type: "system",
            text: "Hello! Would you like to schedule a visit?",
            options: [
              { id: "schedule", text: "Schedule a visit request" }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      setMessages([
        {
          type: "system",
          text: "There was an error checking your profile. Please try again later.",
          options: [
            { id: "retry", text: "Retry" },
            { id: "login", text: "Login Again" }
          ]
        }
      ]);
    }
  };
  
  const handleOptionSelect = (optionId) => {
    if (optionId === "login") {
      navigate("/login");
      return;
    }

    if (optionId === "profile") {
      navigate("/profile");
      return;
    }

    if (optionId === "retry") {
      checkUserProfileCompletion();
      return;
    }

    if (optionId === "schedule") {
      setMessages([
        ...messages,
        { type: "user", text: "I'd like to schedule a visit" },
        {
          type: "system",
          text: "Please select your first preferred date:",
          calendar: true
        }
      ]);
      setCurrentStep("selectDate");
    }
  };
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    setMessages([
      ...messages,
      { type: "user", text: `I'd like to come on ${date.toLocaleDateString()}` },
      {
        type: "system",
        text: "Please select a time slot:",
        timeSlots: true
      }
    ]);
    setCurrentStep("selectTime");
  };
  
  const handleTimeSelect = (time) => {
    // Create a complete appointment with date and time
    const appointment = {
      date: selectedDate.toLocaleDateString(),
      time: time,
      formatted: `${selectedDate.toLocaleDateString()} at ${time}`
    };
    
    // Add to preferred appointments
    const updatedAppointments = [...preferredAppointments, appointment];
    setPreferredAppointments(updatedAppointments);
    
    // Increment the appointment counter
    const currentCount = appointmentCount + 1;
    setAppointmentCount(currentCount);

    // Check if user has completed their profile
    checkUserProfile(currentCount, appointment);
  };

  // New function to check user profile
  const checkUserProfile = async (currentCount, appointment) => {
    try {
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
      const isProfileComplete = profileData.fullName && 
                               profileData.phone && 
                               profileData.address;
      
      if (!isProfileComplete) {
        // Profile is not complete, show options
        setMessages([
          ...messages,
          { type: "user", text: `My preference ${currentCount}: ${appointment.formatted}` },
          {
            type: "system",
            text: "Before continuing, you must complete your profile with your name, phone, and address.",
            options: [
              { id: "continue", text: "Continue scheduling" },
              { id: "profile", text: "Complete my profile first" }
            ]
          }
        ]);
        return;
      }
      
      // Profile is complete, continue with booking process
      continueWithBooking(currentCount, appointment);
    } catch (error) {
      console.error("Error checking user profile:", error);
      setMessages([
        ...messages,
        { type: "user", text: `My preference ${currentCount}: ${appointment.formatted}` },
        {
          type: "system",
          text: "There was an issue checking your profile, but we'll continue with your booking."
        }
      ]);
      continueWithBooking(currentCount, appointment);
    }
  };

  // Function to continue with booking after profile check
  const continueWithBooking = (currentCount, appointment) => {
    // If less than 3 appointments selected, ask for more
    if (currentCount < 3) {
      const ordinalText = currentCount === 1 ? "2nd" : "3rd";
      setMessages([
        ...messages,
        { type: "user", text: `My preference ${currentCount}: ${appointment.formatted}` },
        {
          type: "system",
          text: `Thank you. Now select your ${ordinalText} preferred date:`,
          calendar: true
        }
      ]);
      setCurrentStep("selectDate");
    } else {
      // All 3 appointments selected, ask for a message to the dealer
      setMessages([
        ...messages,
        { type: "user", text: `My preference 3: ${appointment.formatted}` },
        {
          type: "system",
          text: "Would you like to add a message for the property owner? (Optional)",
          messageInput: true
        }
      ]);
      
      setCurrentStep("message");
    }
  };

  const handleMessageChange = (e) => {
    setUserMessage(e.target.value);
  };

  const handleMessageSubmit = async () => {
    try {
      // Get user profile data
      const profileResponse = await fetch("http://localhost:5000/users/profile", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userProfile = await profileResponse.json();

      // Make sure we have property data with the correct owner email
      if (!propertyData) {
        throw new Error("Property data not available");
      }

      // Create appointment request with the correct property owner email
      const appointmentRequest = {
        property: {
          id: propertyId,
          name: propertyData.name,
          location: propertyData.location,
          ownerEmail: propertyData.ownerEmail // Use the actual property owner's email
        },
        appointments: preferredAppointments,
        message: userMessage,
        userEmail: localStorage.getItem("userEmail"),
        userProfile: userProfile
      };

      console.log('Creating appointment with data:', appointmentRequest);

      const response = await fetch("http://localhost:5000/appointments", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentRequest)
      });

      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      setMessages([
        ...messages,
        { type: "user", text: userMessage || "No message" },
        {
          type: "system",
          text: "Your appointment request has been sent successfully! The property owner will review your request and get back to you soon."
        }
      ]);

      // Close the chat interface after a delay
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error submitting appointment:", error);
      setMessages([
        ...messages,
        {
          type: "system",
          text: "There was an error submitting your appointment request. Please try again later."
        }
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleMessageSubmit();
    }
  };
  
  // Generate current month calendar
  const generateCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      // Only allow future dates
      if (date >= today) {
        dates.push(date);
      }
    }
    
    // Add days from next month to show a 30-day period
    if (dates.length < 30) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const daysToAdd = 30 - dates.length;
      
      for (let day = 1; day <= daysToAdd; day++) {
        const date = new Date(nextMonthYear, nextMonth, day);
        dates.push(date);
      }
    }
    
    return dates;
  };

  // Check if a date is already selected in one of the appointments
  const isDateSelected = (date) => {
    return preferredAppointments.some(app => {
      // Convert both to simple date strings for comparison
      const appDate = new Date(app.date).toDateString();
      const checkDate = date.toDateString();
      return appDate === checkDate;
    });
  };

  // Add function to handle phone number input
  const handlePhoneChange = (e) => {
    setCallbackPhone(e.target.value);
  };

  // Add function to handle phone number submission
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    
    if (!callbackPhone) {
      alert("Please enter a valid phone number");
      return;
    }
    
    setMessages([
      ...messages,
      { type: "user", text: `My phone number: ${callbackPhone}` },
      { 
        type: "system", 
        text: "Thank you! Your callback request has been sent to the property owner. They will call you back soon."
      }
    ]);
    
    // Send request (you'll need to implement this functionality in the backend)
    sendContactRequest('callback', callbackPhone);
    
    setCurrentStep("complete");
    setCallbackPhone("");
  };

  // Function to send contact requests to backend
  const sendContactRequest = async (requestType, phoneNumber) => {
    try {
      // Make sure we have property data
      if (!propertyData) {
        console.error("Property data not available for contact request");
        return;
      }
      
      // Prepare request data
      const requestData = {
        propertyId: propertyId,
        propertyName: propertyData.name || "Property",
        ownerEmail: propertyData.ownerEmail, // Use the actual property owner's email
        userEmail: localStorage.getItem("userEmail"),
        requestType,
        phoneNumber,
        createdAt: new Date().toISOString()
      };
      
      // You would need to implement this endpoint on your backend
      /*
      const response = await fetch("http://localhost:5000/contact-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error("Failed to send contact request");
      }
      */
      
      // For now, just log the request to console
      console.log("Contact request sent:", requestData);
    } catch (error) {
      console.error("Error sending contact request:", error);
    }
  };

  // Add useEffect to fetch property data when the component mounts
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        console.log(`Fetching property data for ID: ${propertyId}`);
        const response = await fetch(`http://localhost:5000/properties/${propertyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch property data');
        }
        const data = await response.json();
        setPropertyData(data);
        console.log('Fetched property data:', data);
        console.log('Property owner email:', data.ownerEmail);
      } catch (error) {
        console.error('Error fetching property data:', error);
      }
    };
    
    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId]);

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Schedule a Visit</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <p>{message.text}</p>
            
            {message.options && (
              <div className="message-options">
                {message.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className="option-button"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            )}
            
            {message.calendar && (
              <div className="calendar-container">
                <div className="calendar-header">
                  <h4>Select a Date</h4>
                </div>
                <div className="calendar-grid">
                  {availableDates.map((date, index) => {
                    const dateIsSelected = isDateSelected(date);
                    return (
                      <button
                        key={index}
                        className={`calendar-date ${selectedDate?.toDateString() === date.toDateString() ? 'selected' : ''} ${dateIsSelected ? 'disabled' : ''}`}
                        onClick={() => !dateIsSelected && handleDateSelect(date)}
                        disabled={dateIsSelected}
                      >
                        <span className="day">{date.getDate()}</span>
                        <span className="month">{date.toLocaleString('default', { month: 'short' })}</span>
                        {dateIsSelected && <span className="already-booked">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {message.timeSlots && (
              <div className="time-slots-container">
                <div className="time-slots-grid">
                  {timeSlots.map((time, index) => (
                    <button
                      key={index}
                      className="time-slot-button"
                      onClick={() => handleTimeSelect(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {message.messageInput && (
              <div className="message-input-container">
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="message-input"
                />
                <button
                  onClick={handleMessageSubmit}
                  className="submit-button"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatInterface; 
import React, { useState, useEffect } from "react";
import "../styles.css";
import { motion } from "framer-motion";

const Feedback = () => {
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [animation, setAnimation] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const feedbackTopics = [
    { id: "website", icon: "🖥️", label: "Website Experience", color: "#6366F1" },
    { id: "properties", icon: "🏠", label: "Properties & Listings", color: "#8B5CF6" },
    { id: "agents", icon: "👥", label: "Agent Experience", color: "#EC4899" },
    { id: "search", icon: "🔍", label: "Search Functionality", color: "#F97316" },
    { id: "amenities", icon: "🏙️", label: "Nearby Amenities", color: "#10B981" },
    { id: "navigation", icon: "🧭", label: "Website Navigation", color: "#06B6D4" },
    { id: "features", icon: "⭐", label: "Features & Tools", color: "#EAB308" },
    { id: "design", icon: "🎨", label: "Design & Interface", color: "#F43F5E" }
  ];

  useEffect(() => {
    // Trigger animation on mount
    setAnimation(true);
  }, []);

  const toggleTopic = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleRatingHover = (hoveredRating) => {
    setHoverRating(hoveredRating);
  };

  const handleFeedbackChange = (e) => {
    const text = e.target.value;
    setFeedback(text);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const resetForm = () => {
    setFeedback("");
    setName("");
    setEmail("");
    setRating(0);
    setSelectedTopics([]);
    setFormError("");
    setWordCount(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    // Validate form
    if (feedback.trim().length < 10) {
      setFormError("Please provide more detailed feedback (at least 10 characters)");
      return;
    }

    if (rating === 0) {
      setFormError("Please select a rating");
      return;
    }

    // Submit form
    setSubmitted(true);
    
    // Reset form after delay
    setTimeout(() => {
      resetForm();
      setSubmitted(false);
    }, 5000);
  };

  // Enhanced Rating star component with better visibility
  const RatingStars = () => {
    // Define colors based on rating levels
    const getStarColor = (starValue) => {
      if (starValue <= (hoverRating || rating)) {
        if (hoverRating || rating <= 2) return "#FF5252"; // Red for low ratings
        if (hoverRating || rating <= 3) return "#FFA726"; // Orange for medium ratings
        if (hoverRating || rating <= 4) return "#FFEB3B"; // Yellow for good ratings
        return "#4CAF50"; // Green for excellent ratings
      }
      return "#E0E0E0"; // Default inactive color
    };
    
    // Define star glow effects
    const getStarShadow = (starValue) => {
      if (starValue <= (hoverRating || rating)) {
        const color = getStarColor(starValue).replace(")", ", 0.5)").replace("rgb", "rgba");
        return `0 0 10px ${color}, 0 0 20px ${color}`;
      }
      return "none";
    };

    return (
      <div className="rating-container" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "column",
        marginTop: "10px"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "12px",
          marginBottom: "10px"
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => handleRatingHover(star)}
              onMouseLeave={() => handleRatingHover(0)}
              style={{
                fontSize: "38px",
                lineHeight: "1",
                cursor: "pointer",
                color: getStarColor(star),
                textShadow: getStarShadow(star),
                transition: "all 0.2s ease",
                userSelect: "none",
                position: "relative",
              }}
            >
              {/* Star shape with better visibility */}
              <span style={{ position: "relative", zIndex: 1 }}>★</span>
              
              {/* Background glow effect */}
              {star <= (hoverRating || rating) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${getStarColor(star)}44 0%, transparent 70%)`,
                    zIndex: 0
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
        {rating > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rating-text"
            style={{
              fontWeight: "600",
              fontSize: "16px",
              color: getStarColor(rating),
              background: "rgba(255, 255, 255, 0.7)",
              padding: "6px 12px",
              borderRadius: "20px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              marginTop: "5px"
            }}
          >
            {rating === 1 ? "Poor" : 
             rating === 2 ? "Fair" : 
             rating === 3 ? "Good" : 
             rating === 4 ? "Very Good" : "Excellent!"}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className="feedback-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: "1200px",
        width: "98%",
        margin: "0 auto",
        padding: "35px 50px",
        borderRadius: "24px",
        backgroundColor: "#fff",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.18)",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* Background design elements */}
      <div style={{
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        backgroundColor: "rgba(139, 74, 19, 0.05)",
        top: "-150px",
        right: "-150px",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        backgroundColor: "rgba(139, 74, 19, 0.03)",
        bottom: "-100px",
        left: "-100px",
        zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="feedback-header" style={{
          textAlign: "center",
          marginBottom: "25px",
          position: "relative"
        }}>
          <h2 style={{
            color: "#8B4513",
            fontSize: "34px",
            fontWeight: "700",
            marginBottom: "10px",
            background: "linear-gradient(to right, #8B4513, #D2691E)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px"
          }}>Help us improve your real estate experience</h2>
          <div style={{
            width: "60px",
            height: "4px",
            background: "linear-gradient(to right, #8B4513, #D2691E)",
            margin: "0 auto",
            borderRadius: "2px"
          }} />
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px"
          }}>
            {/* Rating section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rating-section"
              style={{
                background: "linear-gradient(to right, #f8f9fa, #f3f4f6)",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
                textAlign: "center"
              }}
            >
              <label style={{ 
                fontSize: "18px", 
                fontWeight: "600", 
                color: "#8B4513", 
                marginBottom: "15px", 
                display: "block" 
              }}>
                How would you rate your experience?
              </label>
              <RatingStars />
            </motion.div>

            {/* Topics section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="topics-section"
              style={{
                background: "linear-gradient(to right, #f8f9fa, #f3f4f6)",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)"
              }}
            >
              <label style={{ 
                fontSize: "18px", 
                fontWeight: "600", 
                color: "#8B4513", 
                marginBottom: "15px", 
                display: "block" 
              }}>
                What would you like to give feedback on? (Select all that apply)
              </label>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
                margin: "10px 0"
              }}>
                {feedbackTopics.map(topic => (
                  <motion.div
                    key={topic.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTopic(topic.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      backgroundColor: selectedTopics.includes(topic.id) 
                        ? `${topic.color}20` 
                        : "#ffffff",
                      border: `1px solid ${selectedTopics.includes(topic.id) 
                        ? topic.color 
                        : "#e0e0e0"}`,
                      boxShadow: selectedTopics.includes(topic.id)
                        ? `0 4px 8px ${topic.color}20`
                        : "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{
                      fontSize: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: selectedTopics.includes(topic.id)
                        ? `${topic.color}15`
                        : "#f8f9fa"
                    }}>{topic.icon}</span>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: selectedTopics.includes(topic.id)
                        ? topic.color
                        : "#555"
                    }}>{topic.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Feedback text section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="feedback-text-section"
              style={{
                background: "linear-gradient(to right, #f8f9fa, #f3f4f6)",
                padding: "20px",
                borderRadius: "16px",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(139, 69, 19, 0.08)"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <label 
                  htmlFor="feedback" 
                  style={{ 
                    fontSize: "18px", 
                    fontWeight: "600", 
                    color: "#8B4513"
                  }}
                >
                  Your Feedback
                </label>
                <span style={{
                  fontSize: "14px",
                  color: wordCount >= 10 ? "#10B981" : "#9CA3AF",
                  fontWeight: "500"
                }}>
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
              </div>
              <textarea
                id="feedback"
                placeholder="Tell us what you think or suggest improvements..."
                value={feedback}
                onChange={handleFeedbackChange}
                style={{
                  width: "100%",
                  minHeight: "140px",
                  padding: "15px",
                  borderRadius: "14px",
                  border: "1px solid #e0e0e0",
                  resize: "vertical",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
                  fontFamily: "inherit",
                  lineHeight: "1.6",
                  color: "#333"
                }}
              />
            </motion.div>

            {/* User details section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="user-details"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px"
              }}
            >
              <div className="form-group">
                <label 
                  htmlFor="name" 
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#8B4513",
                    fontSize: "15px"
                  }}
                >
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
                  }}
                />
              </div>
              
              <div className="form-group">
                <label 
                  htmlFor="email" 
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#8B4513",
                    fontSize: "15px"
                  }}
                >
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
                  }}
                />
              </div>
            </motion.div>

            {/* Form controls */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="form-controls"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                padding: "0 8px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                {formError && (
                  <div className="error-message" style={{
                    color: "#EF4444",
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "10px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    boxShadow: "0 2px 5px rgba(239, 68, 68, 0.1)"
                  }}>
                    <span style={{ marginRight: "6px" }}>⚠️</span>
                    {formError}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "12px",
                    backgroundColor: "#f8f9fa",
                    color: "#8B4513",
                    border: "1px solid #ddd",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    marginLeft: formError ? "15px" : "0"
                  }}
                >
                  Reset
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(139, 69, 19, 0.4)" }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                style={{
                  padding: "14px 32px",
                  borderRadius: "12px",
                  background: "linear-gradient(to right, #8B4513, #D2691E)",
                  color: "white",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 6px 15px rgba(139, 69, 19, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <span style={{ marginRight: "8px", fontSize: "18px" }}>📤</span>
                Submit Feedback
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)",
                  backgroundSize: "200% 200%",
                  animation: "shine 2s infinite"
                }} />
                <style>
                {`
                  @keyframes shine {
                    0% {
                      background-position: 200% 0;
                    }
                    100% {
                      background-position: -200% 0;
                    }
                  }
                `}
                </style>
              </motion.button>
            </motion.div>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="thank-you-message"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              backgroundColor: "#F0F9FF",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)"
            }}
          >
            <div style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#8B4513",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              position: "relative",
              boxShadow: "0 10px 20px rgba(139, 69, 19, 0.2)"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1.2, 1], opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "2px solid #8B4513",
                  opacity: 0.5
                }}
              />
            </div>
            
            <h3 style={{
              color: "#8B4513",
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "15px"
            }}>Thank You for Your Feedback!</h3>
            
            <p style={{
              color: "#4B5563",
              fontSize: "16px",
              maxWidth: "500px",
              margin: "0 auto 25px"
            }}>
              We greatly appreciate you taking the time to share your thoughts with us. 
              Your feedback helps us improve our real estate services for you and all our customers.
            </p>
            
            <button
              onClick={() => setSubmitted(false)}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                backgroundColor: "white",
                color: "#8B4513",
                border: "2px solid #8B4513",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Submit Another Response
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Feedback;

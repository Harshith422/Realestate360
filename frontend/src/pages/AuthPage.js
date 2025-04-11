import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles.css";
import VerifyOTP from "../components/VerifyOTP";

const AuthPage = (props) => {
  const { setIsLoggedIn, onLogin } = props;
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    if (token) {
      setIsLoggedIn(true);
      setFormData({
        ...formData,
        email: email,
      });
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate inputs
  const validate = () => {
    let tempErrors = {};
    
    if (!formData.email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Invalid email address";
    }
    
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        tempErrors.confirmPassword = "Please confirm your password";
      } else if (formData.confirmPassword !== formData.password) {
        tempErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle form submission (Login/Signup)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setMessage("");
    setErrors({});

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const response = await api.post(endpoint, { 
        email: formData.email, 
        password: formData.password 
      });

      setIsSubmitting(false);

      if (isLogin) {
        // Store token and email
        if (response.data.token) {
          setMessage("✅ Logged in successfully!");
          setIsLoggedIn(true);
          
          // If onLogin handler exists, use it
          if (onLogin) {
            onLogin(response.data.token, formData.email);
          } else {
            // Fallback to just setting isLoggedIn
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userEmail', formData.email);
          }
          
          navigate("/");
        } else {
          setErrors({ api: "No authentication token received" });
        }
      } else {
        setMessage("✅ Signup successful! Please verify your OTP.");
        setOtpSent(true);
      }
    } catch (error) {
      setErrors({ api: error.response?.data?.error || "❌ Server error! Please try again." });
      setIsSubmitting(false);
    }
  };

  // Toggle between Login & Signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setMessage("");
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-image-container">
          <div className="auth-overlay"></div>
          <div className="auth-content">
            <h2>{isLogin ? "Welcome Back" : "Join Our Community"}</h2>
            <p>
              {isLogin
                ? "Sign in to unlock exclusive property listings and connect with top real estate agents."
                : "Create an account to start your journey to finding your dream property or selling your home at the best value."}
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <i className="fas fa-house-user"></i>
                <span>Personalized Property Matches</span>
              </div>
              <div className="auth-feature">
                <i className="fas fa-coins"></i>
                <span>Exclusive Pricing & Deals</span>
              </div>
              <div className="auth-feature">
                <i className="fas fa-handshake"></i>
                <span>Connect with Expert Agents</span>
              </div>
              <div className="auth-feature">
                <i className="fas fa-chart-line"></i>
                <span>Real-time Market Insights</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-header">
            <div className="auth-logo">
              <Link to="/">
                <span>🏡 Real Estate</span>
              </Link>
            </div>
            <div className="auth-toggle-container">
              <button
                className={`auth-toggle-btn ${isLogin ? "active" : ""}`}
                onClick={() => isLogin ? null : toggleAuthMode()}
              >
                Sign In
              </button>
              <button
                className={`auth-toggle-btn ${!isLogin ? "active" : ""}`}
                onClick={() => isLogin ? toggleAuthMode() : null}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="auth-form-wrapper">
            {otpSent ? (
              <VerifyOTP email={formData.email} onVerify={() => navigate("/")} />
            ) : (
              <>
                <h2>{isLogin ? "Welcome Back" : "Create Your Account"}</h2>
                {message && <p className="success">{message}</p>}
                {errors.api && <p className="error">{errors.api}</p>}

                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "error" : ""}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? "error" : ""}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>

                  {!isLogin && (
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={errors.confirmPassword ? "error" : ""}
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  )}

                  <button type="submit" className={`auth-submit-btn ${isSubmitting ? "loading" : ""}`} disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
                  </button>
                </form>

                <p className="auth-footer">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button className="auth-toggle-link" onClick={toggleAuthMode}>
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

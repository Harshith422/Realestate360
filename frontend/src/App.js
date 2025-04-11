import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import CustomCursor from "./components/CustomCursor";
import Home from "./pages/Home";
import PropertyPage from "./pages/PropertyPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import EditProperty from "./pages/EditProperty";
import UploadProperty from "./pages/UploadProperty";
import BookingPage from "./pages/BookingPage";
import AuthPage from "./pages/AuthPage";
import VerifyOTP from "./components/VerifyOTP";
import Team from "./components/Team";
import Feedback from "./components/Feedback";
import ProfilePage from "./pages/ProfilePage";
import MarketTrends from "./pages/MarketTrends";

// Error boundary to catch errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <details>
            <summary>Error Details</summary>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authToken, setAuthToken] = useState('');

  // Check authentication status on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    if (token) {
      setIsLoggedIn(true);
      setAuthToken(token);
      if (email) {
        setUserEmail(email);
      }
    }
  }, []);

  // Handle login success
  const handleLogin = (token, email) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);
    setAuthToken(token);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setAuthToken('');
    setUserEmail('');
    setIsLoggedIn(false);
  };

  // Colors for the cursor and overall theme
  const theme = {
    colors: {
      primary: '#8B4513',
      secondary: '#A0522D',
      background: '#FFFFFF',
      text: '#333333',
      accent: '#4A90E2',     // Light blue
      white: '#FFFFFF',
      navBackground: '#0E1214',
      navText: '#FFFFFF',
      footer: '#0E1214',
      footerText: '#FFFFFF',
      muted: '#777777',
      border: '#DDDDDD',
      shadow: 'rgba(0, 0, 0, 0.1)',
      success: '#28A745',
      error: '#DC3545',
      warning: '#FFC107',
      info: '#17A2B8'
    },
  };

  return (
    <Router>
      <ErrorBoundary>
        {/* Custom cursor applied to entire app */}
        <CustomCursor colors={theme.colors} />
        
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} userEmail={userEmail} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyPage isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} />} />
          <Route path="/property/:id" element={<PropertyDetailPage isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} />} />
          <Route path="/edit-property/:id" element={<EditProperty isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} />} />
          <Route path="/upload-property" element={<UploadProperty isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} />} />
          <Route path="/profile" element={<ProfilePage isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} />} />
          <Route path="/booking" element={isLoggedIn ? <BookingPage isLoggedIn={isLoggedIn} authToken={authToken} userEmail={userEmail} /> : <AuthPage setIsLoggedIn={setIsLoggedIn} onLogin={handleLogin} />} />
          <Route path="/login" element={<AuthPage setIsLoggedIn={setIsLoggedIn} onLogin={handleLogin} />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/team" element={<Team />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/market-trends" element={<MarketTrends />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;

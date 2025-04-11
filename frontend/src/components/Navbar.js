import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles.css";
import { motion } from "framer-motion";

const Navbar = ({ isLoggedIn, onLogout, userEmail }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <div className="logo-icon">
            <div className="building-icon-small">
              <div className="building-nav"></div>
              <div className="building-nav building-small-nav"></div>
              <div className="building-nav building-medium-nav"></div>
            </div>
          </div>
          <span className="logo-text">RealEstate <span className="logo-accent">360</span></span>
        </Link>

        <div className="mobile-menu-button" onClick={toggleMenu}>
          <div className={`menu-icon ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className={isActive('/')} onClick={closeMenu}>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </Link>
          <Link to="/properties" className={isActive('/properties')} onClick={closeMenu}>
            <span className="nav-icon">🏢</span>
            <span className="nav-text">Properties</span>
          </Link>
          <Link to="/market-trends" className={isActive('/market-trends')} onClick={closeMenu}>
            <span className="nav-icon">📈</span>
            <span className="nav-text">Market Trends</span>
          </Link>
          <Link to="/feedback" className={isActive('/feedback')} onClick={closeMenu}>
            <span className="nav-icon">💬</span>
            <span className="nav-text">Feedback</span>
          </Link>
          <Link to="/team" className={isActive('/team')} onClick={closeMenu}>
            <span className="nav-icon">👥</span>
            <span className="nav-text">Our Team</span>
          </Link>
          
          {isLoggedIn ? (
            <>
              <li className="nav-item user-email">
                <Link to="/profile" className={isActive('/profile')} onClick={closeMenu}>
                  <span className="user-icon">👤</span> Profile
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn-logout" onClick={() => { closeMenu(); onLogout(); }}>
                  <span className="nav-icon">🚪</span>
                  <span className="nav-text">Logout</span>
                </button>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <Link to="/login" className={`login-button ${isActive('/login')}`} onClick={closeMenu}>Login</Link>
            </li>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

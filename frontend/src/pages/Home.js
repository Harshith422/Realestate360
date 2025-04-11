import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropertyList from "../components/PropertyList";
import "../styles.css";
import PropertyDetails from '../components/PropertyDetails';

const Home = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [textAnimationComplete, setTextAnimationComplete] = useState(false);
  const [buildingAnimationActive, setBuildingAnimationActive] = useState(false);
  const [properties, setProperties] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  
  // Color palette
  const colors = {
    lightBrown: "#FFFFFF",
    beige: "#FFFFFF",
    lightBeige: "#FFFFFF",
    darkBeige: "#FFFFFF",
    mediumBrown: "#FFFFFF",
    darkBrown: "#000000",
    shinyOrange: "#4A90E2",
    lightOrange: "#5DA9E9",
    cream: "#000000",
    lightestBrown: "#FFFFFF",
    warmBrown: "#FFFFFF"
  };

  // Dynamic keyframe animations
  const keyframeAnimations = `
    @keyframes gentleFloat {
      0%, 100% { transform: translateY(0) translateX(0); }
      25% { transform: translateY(-5px) translateX(5px); }
      50% { transform: translateY(0) translateX(0); }
      75% { transform: translateY(5px) translateX(-5px); }
    }

    @keyframes cardHover {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }

    @keyframes colorPulse {
      0%, 100% {
        filter: saturate(100%) brightness(100%);
        box-shadow: 0 8px 20px rgba(74, 144, 226, 0.2), 0 0 30px rgba(74, 144, 226, 0.1);
      }
      50% {
        filter: saturate(110%) brightness(105%);
        box-shadow: 0 10px 30px rgba(74, 144, 226, 0.3), 0 0 35px rgba(74, 144, 226, 0.15);
      }
    }
    
    @keyframes lightLeak {
      0%, 100% { opacity: 0.3; transform: translateX(-20%) translateY(10%) scale(1.1); }
      50% { opacity: 0.5; transform: translateX(-18%) translateY(8%) scale(1.12); }
    }
    
    @keyframes ambientGlow {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.6; }
    }
  `;

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
      
    // Animation sequence
      setTimeout(() => {
      if (isMounted) {
        setBuildingAnimationActive(true);
      }
    }, 300);
        
        setTimeout(() => {
      if (isMounted) {
        setTextAnimationComplete(true);
      }
    }, 1200);
    
    setTimeout(() => {
      if (isMounted) {
          setAnimationComplete(true);
      }
    }, 2000);

    // Scroll event for back to top button
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    const fetchProperties = async () => {
      try {
        const response = await fetch('http://localhost:5000/properties');
        const data = await response.json();
        
        // Get all properties
        let allProperties = data.properties || [];
        
        // Add the specific properties if they don't exist
        const specificProperties = [
          {
            _id: 'heaven_property',
            name: 'Heaven',
            price: '12 Crore',
            location: '789, Sai Asirwad, KPHB Phase 2, Kukatpally, Hyderabad, Telangana 500072, India',
            area: '1800 sq.ft',
            bedrooms: 3,
            bathrooms: 2,
            propertyType: 'flat',
            description: 'Nice Property',
            images: [
              '/images/plot.jpg',
              '/images/plot2.jpg',
              '/images/auth-bg.jpg'
            ]
          },
          {
            _id: 'sardhar_nest',
            name: 'Sardhar nest',
            price: '60 Lakhs',
            location: 'M58M+C8F, Visakhapatnam, Andhra Pradesh 530044, India',
            area: '1700 sq.ft',
            bedrooms: 3,
            bathrooms: 2,
            propertyType: 'flat',
            description: 'Sardar Nest is a luxurious and modern residential project that is a gated',
            images: [
              '/images/plot2.jpg',
              '/images/plot.jpg',
              '/images/auth-bg.jpg'
            ]
          }
        ];
        
        // Check if these properties already exist in allProperties
        specificProperties.forEach(specProp => {
          const exists = allProperties.some(prop => 
            prop.name === specProp.name || 
            prop._id === specProp._id
          );
          
          if (!exists) {
            allProperties.push(specProp);
          }
        });

        if (allProperties && allProperties.length > 0) {
          if (isMounted) {
            // Make sure all properties have valid images
            allProperties = allProperties.map(prop => {
              // If no images or empty images array, add default images
              if (!prop.images || prop.images.length === 0) {
                return {
                  ...prop,
                  images: ['/images/plot.jpg', '/images/plot2.jpg']
                };
              }
              return prop;
            });
            
            setProperties(allProperties);
        
            // Sort properties by price in descending order
            const sortedProperties = [...allProperties].sort((a, b) => {
              const extractNumericValue = (priceStr) => {
                const numericPart = priceStr.replace(/[^\d.]/g, '');
                const value = parseFloat(numericPart);
                
                if (priceStr.toLowerCase().includes('crore')) {
                  return value * 10000000;
                } else if (priceStr.toLowerCase().includes('lakh')) {
                  return value * 100000;
                }
                return value;
              };
              
              const priceA = extractNumericValue(a.price);
              const priceB = extractNumericValue(b.price);
              
              return priceB - priceA;
            });
            
            // Get the top 3 highest-priced properties
            const topProperties = sortedProperties.slice(0, 3);
            setFeaturedProperties(topProperties);
            
            console.log('Featured Properties:', topProperties);
          }
        } else {
          console.error('No properties available');
          if (isMounted) {
            setProperties([]);
            setFeaturedProperties([]);
          }
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        if (isMounted) {
          setProperties([]);
          setFeaturedProperties([]);
        }
      }
    };

    fetchProperties();

    // Clean up function
    return () => {
      isMounted = false;
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Add PropertyCard import
  const PropertyCard = ({ property, index }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const hasMultipleImages = property.images && property.images.length > 1;

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
      // Set a fallback image if current image fails to load
      if (property.images && property.images.length > 0) {
        // Try another image from the array if available
        if (currentImageIndex < property.images.length - 1) {
          transitionToImage(currentImageIndex + 1);
        } else {
          // Use placeholder if all images fail
          property.images = ['/images/plot.jpg'];
          setCurrentImageIndex(0);
        }
      }
    };

    const transitionToImage = (index) => {
      setIsTransitioning(true);
      setIsLoading(true);
      setTimeout(() => {
        setCurrentImageIndex(index);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 200);
    };

    const goToNextImage = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasMultipleImages) {
        const newIndex = currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1;
        transitionToImage(newIndex);
      }
    };

    const goToPrevImage = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasMultipleImages) {
        const newIndex = currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1;
        transitionToImage(newIndex);
      }
    };

    const imageSrc = property.images && property.images.length > 0
      ? property.images[currentImageIndex]
      : property.image || "/images/placeholder.jpg";

    return (
      <div className="property-card" style={{ "--i": index + 1 }}>
        <div className="property-type-tag property-type-tag-hover" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#4A90E2',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          zIndex: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textTransform: 'capitalize',
          border: 'none',
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '40px',
          maxWidth: '60px',
          transition: 'all 0.3s ease'
        }}>
          {property.propertyType === 'flat' ? 'Flat' : 'Land'}
        </div>
        <div className={`image-container ${isLoading ? 'loading' : ''}`} style={{
          position: 'relative',
          width: '100%',
          height: '0',
          paddingBottom: '75%',
          overflow: 'hidden',
          borderRadius: '8px 8px 0 0'
        }}>
          <div className="image-loading-placeholder" />
          <img 
            src={imageSrc} 
            alt={property.name} 
            className={isTransitioning ? 'changing' : ''}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {hasMultipleImages && (
            <>
              <button 
                className="image-nav prev" 
                onClick={goToPrevImage}
                aria-label="Previous image"
              >
                {'<'}
              </button>
              <button 
                className="image-nav next" 
                onClick={goToNextImage}
                aria-label="Next image"
              >
                {'>'}
              </button>
              <div className="image-indicator">
                {property.images.map((_, imgIndex) => (
                  <span 
                    key={imgIndex} 
                    className={`indicator-dot ${imgIndex === currentImageIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      transitionToImage(imgIndex);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="property-card-content">
          <h3>{property.name}</h3>
          <p className="property-price">{property.price}</p>
          <p className="property-description-short">
            {property.description && property.description.length > 100
              ? `${property.description.substring(0, 100)}...`
              : property.description}
          </p>
          <p>📍 {property.location}</p>
          <div className="property-features">
            {property.propertyType === "flat" && (
              <>
                <div className="property-feature">
                  <span>📏 {property.area}</span>
                </div>
                <div className="property-feature">
                  <span>🛏️ {property.bedrooms} BR</span>
                </div>
                <div className="property-feature">
                  <span>🚿 {property.bathrooms} BA</span>
                </div>
              </>
            )}
            
            {property.propertyType === "land" && (
              <>
                <div className="property-feature">
                  <span>📏 {property.landArea}</span>
                </div>
                <div className="property-feature">
                  <span>🏞️ {property.landType && property.landType.charAt(0).toUpperCase() + property.landType.slice(1)}</span>
                </div>
              </>
            )}
          </div>
          <Link to={`/property/${property._id || property.id}`} className="btn btn-view-details">View Details</Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: keyframeAnimations}} />
      {/* Full Screen Introduction */}
      <section className="intro-section" style={{ 
        background: `linear-gradient(135deg, ${colors.darkBeige}, ${colors.lightBrown})`, 
        color: colors.cream, 
        boxShadow: "none",
        border: "none",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Cinematic Vignette */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.2) 100%)",
          zIndex: 3,
          pointerEvents: "none",
          mixBlendMode: "multiply"
        }}></div>
        
        {/* Light Leak Effect */}
        <div style={{
          position: "absolute",
          top: "-50%",
          left: "-10%",
          width: "120%",
          height: "200%",
          background: "radial-gradient(ellipse at center, rgba(255,165,0,0.15) 0%, rgba(255,140,0,0) 70%)",
          opacity: 0.3,
          zIndex: 1,
          pointerEvents: "none",
          mixBlendMode: "screen",
          animation: "lightLeak 20s infinite ease-in-out"
        }}></div>
        
        {/* Ambient Glow */}
        <div style={{
          position: "absolute",
          top: "30%",
          right: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(ellipse at center, rgba(255,165,0,0.1) 0%, rgba(255,140,0,0) 70%)",
          opacity: 0.4,
          zIndex: 1,
          pointerEvents: "none",
          mixBlendMode: "screen",
          animation: "ambientGlow 15s infinite ease-in-out"
        }}></div>
        
        {/* Add a professional color grading overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(255,140,0,0.08) 0%, rgba(139,90,43,0.12) 100%)",
          zIndex: 1,
          pointerEvents: "none"
        }}></div>
        
        {/* Light rays effect */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-15deg)",
          width: "200%",
          height: "300%",
          background: "radial-gradient(ellipse at center, rgba(255,140,0,0.1) 0%, rgba(255,140,0,0) 70%)",
          opacity: animationComplete ? 0.6 : 0,
          transition: "opacity 1.5s ease-out 0.8s",
          zIndex: 1,
          pointerEvents: "none"
        }}></div>
        
        {/* Logo Text with Building Animation */}
        <div className="intro-logo-animation" style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          zIndex: 5,
          opacity: animationComplete ? 0 : 1,
          transition: "opacity 0.5s ease-out",
          pointerEvents: animationComplete ? "none" : "auto",
          width: "100%"
        }}>
          <h1 style={{
            fontSize: "5rem",
            fontWeight: "bold",
            color: colors.cream,
            textShadow: "0 2px 10px rgba(0,0,0,0.2), 0 0 30px rgba(255,140,0,0.3)",
            transform: textAnimationComplete ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.5s ease-out",
            position: "relative",
            letterSpacing: textAnimationComplete ? "2px" : "0px",
          }}>
            <span>R</span>
            <span>e</span>
            <span>a</span>
            <span>l</span>
            <span style={{ position: "relative" }}>
              E
              {buildingAnimationActive && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "30px",
                  height: buildingAnimationActive ? "100px" : "0px",
                  background: `linear-gradient(135deg, ${colors.darkBrown}, ${colors.shinyOrange})`,
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
                  boxShadow: "0 0 15px rgba(255,140,0,0.5)",
                  zIndex: -1
                }}>
                  <div style={{
                    position: "absolute",
                    top: "10%",
                    left: "20%",
                    width: "6px",
                    height: "6px",
                    background: "rgba(255,255,255,0.7)",
                    boxShadow: `10px 0 0 rgba(255,255,255,0.7),
                               0 15px 0 rgba(255,255,255,0.7),
                               10px 15px 0 rgba(255,255,255,0.7),
                               0 30px 0 rgba(255,255,255,0.7),
                               10px 30px 0 rgba(255,255,255,0.7)`
                  }}></div>
                </div>
              )}
            </span>
            <span>s</span>
            <span>t</span>
            <span>a</span>
            <span>t</span>
            <span>e</span>
            <span> </span>
            <span style={{ position: "relative" }}>
              3
              {buildingAnimationActive && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "35px",
                  height: buildingAnimationActive ? "120px" : "0px",
                  background: `linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown})`,
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.7s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
                  boxShadow: "0 0 15px rgba(166,124,82,0.5)",
                  zIndex: -1
                }}>
                  <div style={{
                    position: "absolute",
                    top: "10%",
                    left: "20%",
                    width: "6px",
                    height: "6px",
                    background: "rgba(255,255,255,0.7)",
                    boxShadow: `12px 0 0 rgba(255,255,255,0.7),
                               0 15px 0 rgba(255,255,255,0.7),
                               12px 15px 0 rgba(255,255,255,0.7),
                               0 30px 0 rgba(255,255,255,0.7),
                               12px 30px 0 rgba(255,255,255,0.7),
                               0 45px 0 rgba(255,255,255,0.7),
                               12px 45px 0 rgba(255,255,255,0.7)`
                  }}></div>
                </div>
              )}
            </span>
            <span style={{ position: "relative" }}>
              6
              {buildingAnimationActive && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "28px",
                  height: buildingAnimationActive ? "85px" : "0px",
                  background: `linear-gradient(135deg, ${colors.shinyOrange}, ${colors.mediumBrown})`,
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
                  boxShadow: "0 0 15px rgba(255,140,0,0.5)",
                  zIndex: -1
                }}>
                  <div style={{
                    position: "absolute",
                    top: "10%",
                    left: "20%",
                    width: "5px",
                    height: "5px",
                    background: "rgba(255,255,255,0.7)",
                    boxShadow: `8px 0 0 rgba(255,255,255,0.7),
                               0 12px 0 rgba(255,255,255,0.7),
                               8px 12px 0 rgba(255,255,255,0.7),
                               0 24px 0 rgba(255,255,255,0.7),
                               8px 24px 0 rgba(255,255,255,0.7)`
                  }}></div>
                </div>
              )}
            </span>
            <span style={{ position: "relative" }}>
              0
              {buildingAnimationActive && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "25px",
                  height: buildingAnimationActive ? "110px" : "0px",
                  background: `linear-gradient(135deg, ${colors.darkBeige}, ${colors.darkBrown})`,
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
                  boxShadow: "0 0 15px rgba(166,124,82,0.5)",
                  zIndex: -1
                }}>
                  <div style={{
                    position: "absolute",
                    top: "10%",
                    left: "20%",
                    width: "5px",
                    height: "5px",
                    background: "rgba(255,255,255,0.7)",
                    boxShadow: `8px 0 0 rgba(255,255,255,0.7),
                               0 12px 0 rgba(255,255,255,0.7),
                               8px 12px 0 rgba(255,255,255,0.7),
                               0 24px 0 rgba(255,255,255,0.7),
                               8px 24px 0 rgba(255,255,255,0.7),
                               0 36px 0 rgba(255,255,255,0.7),
                               8px 36px 0 rgba(255,255,255,0.7)`
                  }}></div>
                </div>
              )}
            </span>
          </h1>
          <p style={{
            fontSize: "1.2rem",
            opacity: textAnimationComplete ? 1 : 0,
            transform: textAnimationComplete ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s",
            color: colors.cream
          }}>
            Building your dream properties
          </p>
          
          {buildingAnimationActive && (
            <div style={{
              position: "absolute",
              bottom: "25%",
              left: "0",
              width: "100%",
              height: "2px",
              background: `linear-gradient(to right, 
                  transparent 10%, 
                  ${colors.shinyOrange} 30%, 
                  ${colors.cream} 50%, 
                  ${colors.shinyOrange} 70%, 
                  transparent 90%)`,
              boxShadow: `0 0 10px ${colors.shinyOrange}, 0 0 20px ${colors.shinyOrange}, 0 0 40px rgba(74, 144, 226, 0.4)`,
              opacity: 0,
              animation: buildingAnimationActive ? "fadeIn 0.5s ease-out 0.4s forwards" : "none"
            }}></div>
          )}
        </div>

        <div className="intro-content" style={{
          opacity: animationComplete ? 1 : 0,
          transition: "opacity 0.8s ease-out",
          position: "relative",
          zIndex: 2
        }}>
          <div className="intro-text-container" style={{
            opacity: animationComplete ? 1 : 0,
            transform: animationComplete ? 'translateY(0)' : 'translateY(50px)',
            transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
            background: 'rgba(74, 144, 226, 0.1)',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 8px 32px rgba(74, 144, 226, 0.1), 0 0 1px rgba(74, 144, 226, 0.5), inset 0 0 20px rgba(74, 144, 226, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(74, 144, 226, 0.2)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h1 className="intro-title" style={{ 
              color: "#000000",
              textShadow: "none",
              marginBottom: "20px"
            }}>Discover Your <span className="highlight" style={{ 
              color: colors.shinyOrange,
              textShadow: `0 0 10px rgba(74, 144, 226, 0.3), 0 0 20px rgba(74, 144, 226, 0.1)`,
              background: "linear-gradient(to right, #4A90E2, #5DA9E9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Perfect</span> Space</h1>
            <p className="intro-description" style={{ 
              color: "#000000",
              fontSize: "1.1rem",
              textShadow: "none",
              marginBottom: "30px"
            }}>
              Explore premium properties curated just for you. Our intelligent matching system connects you with homes that align with your lifestyle and aspirations.
            </p>
            <div className="intro-stats" style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: "30px"
            }}>
              <div className="stat-item">
                <span className="stat-number" style={{ 
                  color: "#000000",
                  textShadow: "none",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  display: "block"
                }}>5000+</span>
                <span className="stat-label" style={{ 
                  color: "#000000",
                  fontSize: "1rem"
                }}>Properties</span>
              </div>
              <div className="stat-item">
                <span className="stat-number" style={{ 
                  color: "#000000",
                  textShadow: "none",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  display: "block"
                }}>2400+</span>
                <span className="stat-label" style={{ 
                  color: "#000000",
                  fontSize: "1rem"
                }}>Happy Clients</span>
              </div>
              <div className="stat-item">
                <span className="stat-number" style={{ 
                  color: "#000000",
                  textShadow: "none",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  display: "block"
                }}>150+</span>
                <span className="stat-label" style={{ 
                  color: "#000000",
                  fontSize: "1rem"
                }}>Cities</span>
              </div>
            </div>
            <div className="intro-buttons" style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center"
            }}>
              <Link 
                to="/properties" 
                className="btn-primary" 
                style={{ 
                  background: `linear-gradient(to right, ${colors.shinyOrange}, ${colors.lightOrange})`, 
                  boxShadow: `0 4px 15px rgba(74, 144, 226, 0.4), 0 0 5px rgba(74, 144, 226, 0.5)`,
                  color: colors.lightestBrown,
                  fontWeight: "bold",
                  border: "none",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: "translateY(0)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px rgba(74, 144, 226, 0.5), 0 0 10px rgba(74, 144, 226, 0.6)`
                  }
                }}
              >
                Explore Properties
              </Link>
              <Link 
                to="/booking" 
                className="btn-secondary" 
                style={{ 
                  color: colors.cream, 
                  borderColor: colors.shinyOrange,
                  background: "rgba(255,255,255,0.1)",
                  fontWeight: "bold",
                  boxShadow: "0 2px 10px rgba(74, 144, 226, 0.2)",
                  backdropFilter: "blur(5px)",
                  transition: "all 0.3s ease"
                }}
              >
                Schedule a Tour
              </Link>
            </div>
          </div>
          <div className="intro-visual" style={{ 
            opacity: animationComplete ? 1 : 0,
            transform: animationComplete ? 'translateX(0)' : 'translateX(50px)',
            transition: 'opacity 1.2s ease-out 0.3s, transform 1.2s ease-out 0.3s'
          }}>
            <div className="floating-cards-container" style={{ 
              display: "flex", 
              justifyContent: "center",
              alignItems: "center",
              gap: "20px",
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "20px",
              animation: "gentleFloat 10s infinite ease-in-out"
            }}>
              <div className="floating-card" style={{ 
                background: "linear-gradient(135deg, #4A90E2, #5DA9E9)",
                color: "#000000",
                boxShadow: "0 8px 20px rgba(74, 144, 226, 0.2), 0 0 30px rgba(74, 144, 226, 0.1)",
                borderRadius: "12px",
                opacity: animationComplete ? 1 : 0,
                animation: "cardHover 6s infinite ease-in-out, colorPulse 8s infinite ease-in-out",
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 1,
                maxWidth: "300px",
                padding: "30px 20px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Card Overlay Glow */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%)",
                  pointerEvents: "none"
                }}></div>
                <div className="card-icon" style={{ 
                  color: "#FFFFFF",
                  fontSize: "2rem",
                  marginBottom: "15px",
                  position: "relative",
                  zIndex: 2,
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8))",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 5px 15px rgba(74, 144, 226, 0.4), inset 0 0 10px rgba(255,255,255,0.2)"
                }}><i className="fas fa-building"></i></div>
                <h3 style={{ 
                  color: "#000000",
                  marginBottom: "10px",
                  fontSize: "1.5rem",
                  position: "relative",
                  zIndex: 2,
                  fontWeight: "600",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>Modern Living</h3>
                <p style={{ 
                  color: "#000000",
                  fontSize: "1rem",
                  lineHeight: "1.5",
                  position: "relative",
                  zIndex: 2,
                  opacity: 0.8
                }}>Contemporary designs with smart home features</p>
              </div>
              <div className="floating-card" style={{ 
                background: "linear-gradient(135deg, #4A90E2, #5DA9E9)",
                color: "#000000",
                boxShadow: "0 8px 20px rgba(74, 144, 226, 0.2), 0 0 30px rgba(74, 144, 226, 0.1)",
                borderRadius: "12px",
                opacity: animationComplete ? 1 : 0,
                animation: "cardHover 6s infinite ease-in-out 0.2s, colorPulse 8s infinite ease-in-out 0.2s",
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 1,
                maxWidth: "300px",
                padding: "30px 20px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Card Overlay Glow */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%)",
                  pointerEvents: "none"
                }}></div>
                <div className="card-icon" style={{ 
                  color: "#FFFFFF",
                  fontSize: "2rem",
                  marginBottom: "15px",
                  position: "relative",
                  zIndex: 2,
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8))",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 5px 15px rgba(74, 144, 226, 0.4), inset 0 0 10px rgba(255,255,255,0.2)"
                }}><i className="fas fa-leaf"></i></div>
                <h3 style={{ 
                  color: "#000000",
                  marginBottom: "10px",
                  fontSize: "1.5rem",
                  position: "relative",
                  zIndex: 2,
                  fontWeight: "600",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>Eco-Friendly</h3>
                <p style={{ 
                  color: "#000000",
                  fontSize: "1rem",
                  lineHeight: "1.5",
                  position: "relative",
                  zIndex: 2,
                  opacity: 0.8
                }}>Sustainable properties with energy efficiency</p>
              </div>
              <div className="floating-card" style={{ 
                background: "linear-gradient(135deg, #4A90E2, #5DA9E9)",
                color: "#000000",
                boxShadow: "0 8px 20px rgba(74, 144, 226, 0.2), 0 0 30px rgba(74, 144, 226, 0.1)",
                borderRadius: "12px",
                opacity: animationComplete ? 1 : 0,
                animation: "cardHover 6s infinite ease-in-out 0.4s, colorPulse 8s infinite ease-in-out 0.4s",
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 1,
                maxWidth: "300px",
                padding: "30px 20px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Card Overlay Glow */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%)",
                  pointerEvents: "none"
                }}></div>
                <div className="card-icon" style={{ 
                  color: "#FFFFFF",
                  fontSize: "2rem",
                  marginBottom: "15px",
                  position: "relative",
                  zIndex: 2,
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8))",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 5px 15px rgba(74, 144, 226, 0.4), inset 0 0 10px rgba(255,255,255,0.2)"
                }}><i className="fas fa-dollar-sign"></i></div>
                <h3 style={{ 
                  color: "#000000",
                  marginBottom: "10px",
                  fontSize: "1.5rem",
                  position: "relative",
                  zIndex: 2,
                  fontWeight: "600",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>Value Investment</h3>
                <p style={{ 
                  color: "#000000",
                  fontSize: "1rem",
                  lineHeight: "1.5",
                  position: "relative",
                  zIndex: 2,
                  opacity: 0.8
                }}>Properties with strong appreciation potential</p>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator" style={{ 
          opacity: animationComplete ? 1 : 0,
          transition: 'opacity 1s ease-out 1.2s'
        }}>
          <span style={{ color: "#000000" }}>Scroll to explore</span>
          <div className="scroll-icon" style={{ background: colors.shinyOrange }}></div>
        </div>
      </section>

      <div className="home-container" style={{ background: colors.warmBrown }}>
        {/* Featured Properties */}
        <section className="featured-section">
          <h2 className="featured-title" style={{ 
            color: colors.darkBrown,
            position: "relative",
            display: "inline-block",
            textAlign: "center",
            width: "100%",
            marginBottom: "40px",
            fontSize: "2.2rem"
          }}>Featured Properties</h2>
          
          {/* Featured Property Cards */}
          <div className="property-list">
            <div className="grid">
            {featuredProperties.length > 0 ? (
                featuredProperties.map((property, index) => (
                  <PropertyCard 
                    key={property._id || index} 
                    property={property} 
                    index={index}
                  />
              ))
            ) : (
              <div style={{ 
                gridColumn: "1 / -1", 
                textAlign: "center", 
                padding: "40px", 
                  color: "#000000" 
              }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", marginBottom: "20px" }}></i>
                  <p>Loading properties from database...</p>
              </div>
            )}
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "30px"
          }}>
            <Link to="/properties" style={{
              display: "inline-block",
              padding: "12px 25px",
              background: `linear-gradient(135deg, ${colors.darkBrown}, ${colors.shinyOrange})`,
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease"
            }}>
              View All Properties
            </Link>
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section" style={{ background: '#FFFFFF', padding: '50px 20px' }}>
          <h2 className="section-title" style={{ 
            color: "#000000",
            position: "relative",
            display: "inline-block",
            textAlign: "center",
            width: "100%",
            marginBottom: "40px",
            fontSize: "2.2rem"
          }}>Our Services</h2>
          <div className="services-grid">
            <div className="service-card" style={{ 
              background: '#FFFFFF',
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              padding: "20px"
            }}>
              <div className="service-icon" style={{ color: colors.shinyOrange }}>
                <i className="fas fa-home"></i>
              </div>
              <h3 style={{ color: "#000000" }}>Property Sales</h3>
              <p style={{ color: "#000000" }}>Find your perfect property with our extensive listings and expert guidance.</p>
            </div>
            <div className="service-card" style={{ 
              background: '#FFFFFF',
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              padding: "20px"
            }}>
              <div className="service-icon" style={{ color: colors.shinyOrange }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 style={{ color: "#000000" }}>Investment Advisory</h3>
              <p style={{ color: "#000000" }}>Make informed decisions with our market analysis and investment strategies.</p>
            </div>
            <div className="service-card" style={{ 
              background: '#FFFFFF',
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              padding: "20px"
            }}>
              <div className="service-icon" style={{ color: colors.shinyOrange }}>
                <i className="fas fa-key"></i>
              </div>
              <h3 style={{ color: "#000000" }}>Property Management</h3>
              <p style={{ color: "#000000" }}>Let us handle the complexities of managing your property investments.</p>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="testimonial-section" style={{ background: '#FFFFFF', padding: '50px 20px' }}>
          <h2 className="section-title" style={{ 
            color: "#000000",
            position: "relative",
            display: "inline-block",
            textAlign: "center",
            width: "100%",
            marginBottom: "40px",
            fontSize: "2.2rem"
          }}>Our Clients Say</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card" style={{ 
              background: '#FFFFFF',
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              padding: "20px"
            }}>
              <div className="testimonial-content">
                <p style={{ color: "#000000" }}>"The team was incredibly helpful in finding our dream home. Their attention to detail and understanding of our needs made the process smooth and enjoyable."</p>
              </div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <img src="/images/testimonial1.jpg" alt="John Doe" style={{ border: `2px solid ${colors.shinyOrange}` }} />
                </div>
                <div className="testimonial-info">
                  <h4 style={{ color: "#000000" }}>John Doe</h4>
                  <p style={{ color: "#000000" }}>Homeowner</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card" style={{ 
              background: '#FFFFFF',
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              padding: "20px"
            }}>
              <div className="testimonial-content">
                <p style={{ color: "#000000" }}>"As an investor, I appreciate their market insights and professional approach. They've helped me build a valuable portfolio of properties."</p>
              </div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <img src="/images/testimonial2.jpg" alt="Jane Smith" style={{ border: `2px solid ${colors.shinyOrange}` }} />
                </div>
                <div className="testimonial-info">
                  <h4 style={{ color: "#000000" }}>Jane Smith</h4>
                  <p style={{ color: "#000000" }}>Property Investor</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section" style={{ 
          background: '#FFFFFF',
          borderRadius: "15px",
          margin: "40px auto",
          maxWidth: "90%",
          boxShadow: "0 15px 35px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ color: "#000000" }}>Ready to Find Your Perfect Property?</h2>
          <p style={{ color: "#000000" }}>Our team of experts is ready to help you at every step of your property journey.</p>
          <Link 
            to="/booking" 
            className="btn" 
            style={{ 
              background: `linear-gradient(to right, ${colors.shinyOrange}, ${colors.lightOrange})`, 
              boxShadow: `0 4px 15px rgba(74, 144, 226, 0.4), 0 0 5px rgba(74, 144, 226, 0.5)`,
              color: "#FFFFFF",
              border: "none",
              fontWeight: "bold",
              padding: "12px 30px",
              borderRadius: "30px",
              transform: "translateY(0)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease"
            }}
          >
            Get Started Today
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer" style={{ 
        background: "#0E1214", 
        color: "#FFFFFF",
        position: "relative",
        padding: "28px 0 15px",
        boxShadow: "0 -5px 20px rgba(0,0,0,0.1)"
      }}>
        <div className="footer-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          {/* Removing the decorative top border */}
          
          <div className="footer-top" style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "25px",
            marginBottom: "15px"
          }}>
            {/* Company Info Column */}
            <div className="footer-column" style={{ marginBottom: "10px" }}>
              <div className="footer-logo" style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                <div style={{ 
                  width: "32px", 
                  height: "32px", 
                  background: colors.shinyOrange, 
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px rgba(74, 144, 226, 0.5)",
                  marginRight: "10px"
                }}>
                  <i className="fas fa-home" style={{ color: "#FFF", fontSize: "16px" }}></i>
              </div>
                <span className="logo-text" style={{ 
                  color: "#FFFFFF",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  letterSpacing: "0.5px"
                }}>RealEstate <span style={{ color: colors.shinyOrange, fontWeight: "700" }}>360</span></span>
              </div>
              <p className="footer-about" style={{ 
                color: "#B0B7BC",
                fontSize: "0.85rem",
                marginBottom: "12px",
                lineHeight: "1.4",
                maxWidth: "95%"
              }}>
                We're committed to helping you find the perfect property that matches your lifestyle and aspirations.
              </p>
              <div className="footer-social" style={{ 
                display: "flex", 
                gap: "10px",
                marginTop: "15px" 
              }}>
                {[
                  { icon: "fab fa-facebook-f", color: "#3b5998" },
                  { icon: "fab fa-twitter", color: "#1da1f2" },
                  { icon: "fab fa-instagram", color: "#e1306c" },
                  { icon: "fab fa-linkedin-in", color: "#0077b5" },
                ].map((social, index) => (
                  <button 
                    key={index}
                    className="social-icon" 
                    style={{ 
                      background: "rgba(255,255,255,0.08)",
                      color: "#FFFFFF",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: social.color,
                        transform: "translateY(-3px)"
                      }
                    }}
                  >
                    <i className={social.icon}></i>
                </button>
                ))}
              </div>
            </div>
            
            {/* Quick Links Column */}
            <div className="footer-column" style={{ marginBottom: "10px" }}>
              <h3 className="footer-heading" style={{ 
                color: "#FFFFFF",
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "15px",
                position: "relative",
                paddingBottom: "8px"
              }}>
                <span style={{ position: "relative", zIndex: 1 }}>Quick Links</span>
                <span style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  left: 0, 
                  width: "30px", 
                  height: "2px", 
                  background: colors.shinyOrange 
                }}></span>
              </h3>
              <ul className="footer-links" style={{ 
                listStyle: "none",
                padding: 0,
                margin: 0
              }}>
                {[
                  { to: "/", label: "Home" },
                  { to: "/properties", label: "Properties" },
                  { to: "/services", label: "Services" },
                  { to: "/about", label: "About Us" },
                  { to: "/contact", label: "Contact" },
                ].map((link, index) => (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    <Link to={link.to} style={{ 
                      color: "#B0B7BC", 
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.2s ease, transform 0.2s ease",
                      fontSize: "0.85rem",
                      "&:hover": {
                        color: colors.shinyOrange,
                        transform: "translateX(3px)"
                      }
                    }}>
                      <i className="fas fa-chevron-right" style={{ 
                        color: colors.shinyOrange, 
                        fontSize: "0.7rem", 
                        marginRight: "8px" 
                      }}></i> 
                      {link.label}
                  </Link>
                </li>
                ))}
              </ul>
            </div>
            
            {/* Contact Column */}
            <div className="footer-column" style={{ marginBottom: "10px" }}>
              <h3 className="footer-heading" style={{ 
                color: "#FFFFFF",
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "15px",
                position: "relative",
                paddingBottom: "8px"
              }}>
                <span style={{ position: "relative", zIndex: 1 }}>Contact Us</span>
                <span style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  left: 0, 
                  width: "30px", 
                  height: "2px", 
                  background: colors.shinyOrange 
                }}></span>
              </h3>
              <div className="footer-contact-info" style={{ 
                fontSize: "0.85rem",
                lineHeight: "1.4"
              }}>
                {[
                  { icon: "fas fa-map-marker-alt", content: "Amrita Vishwa Vidyapeetham<br/>Coimbatore", link: null },
                  { icon: "fas fa-phone-alt", content: "7013704561", link: "tel:7013704561" },
                  { icon: "fas fa-envelope", content: "potnuriharshith@gmail.com", link: "mailto:potnuriharshith@gmail.com" },
                ].map((item, index) => (
                  <div key={index} className="contact-item" style={{ 
                    display: "flex", 
                    marginBottom: "12px",
                    alignItems: "flex-start" 
                  }}>
                    <div className="contact-icon" style={{ 
                      color: colors.shinyOrange,
                      marginRight: "12px",
                      backgroundColor: "rgba(74, 144, 226, 0.1)",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <i className={item.icon}></i>
                  </div>
                    <div className="contact-details" style={{ color: "#B0B7BC" }}>
                      {item.link ? (
                        <a href={item.link} style={{ 
                          color: "#B0B7BC", 
                          textDecoration: "none",
                          transition: "color 0.2s ease",
                          "&:hover": { color: colors.shinyOrange }
                        }}>{item.content}</a>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
                      )}
                  </div>
                </div>
                ))}
              </div>
            </div>
            
            {/* Newsletter Column */}
            <div className="footer-column" style={{ marginBottom: "10px" }}>
              <h3 className="footer-heading" style={{ 
                  color: "#FFFFFF",
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "15px",
                position: "relative",
                paddingBottom: "8px"
              }}>
                <span style={{ position: "relative", zIndex: 1 }}>Newsletter</span>
                <span style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  left: 0, 
                  width: "30px", 
                  height: "2px", 
                  background: colors.shinyOrange 
                }}></span>
              </h3>
              <p className="footer-newsletter" style={{ 
                color: "#B0B7BC",
                fontSize: "0.85rem",
                marginBottom: "15px",
                lineHeight: "1.4"
              }}>Stay updated with the latest property listings and market insights.</p>
              <div className="newsletter-form" style={{ 
                display: "flex",
                marginBottom: "15px" 
              }}>
                <input 
                  type="email" 
                  className="newsletter-input" 
                  placeholder="Your Email Address" 
                  style={{ 
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#FFFFFF",
                    borderRadius: "4px 0 0 4px",
                    padding: "8px 12px",
                    flex: "1",
                    fontSize: "0.85rem"
                  }} 
                />
                <button 
                  className="newsletter-btn" 
                  style={{ 
                    background: colors.shinyOrange,
                    borderRadius: "0 4px 4px 0",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "0 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              <div style={{ 
                fontSize: "0.75rem", 
                color: "#7A8288" 
              }}>
                By subscribing, you agree to our privacy policy and consent to receive updates.
              </div>
            </div>
          </div>
          
          {/* Footer Divider */}
          <div className="footer-divider" style={{ 
            background: "rgba(255,255,255,0.08)",
            height: "1px",
            margin: "5px 0"
          }}></div>
          
          {/* Footer Bottom */}
          <div className="footer-bottom" style={{ 
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "0.8rem",
            padding: "12px 0 0",
            color: "#7A8288"
          }}>
            <div className="copyright">
              &copy; {new Date().getFullYear()} RealEstate 360. All Rights Reserved.
            </div>
            <div className="footer-bottom-links" style={{ 
              display: "flex", 
              gap: "20px" 
            }}>
              {[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Service" },
                { to: "/cookies", label: "Cookies Policy" },
              ].map((link, index) => (
                <Link 
                  key={index}
                  to={link.to} 
                  style={{ 
                    color: "#7A8288", 
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    fontSize: "0.8rem",
                    "&:hover": { color: colors.shinyOrange }
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`} 
        onClick={scrollToTop}
        style={{ 
          background: `linear-gradient(to right, ${colors.shinyOrange}, ${colors.lightOrange})`,
          boxShadow: "0 4px 15px rgba(74, 144, 226, 0.4)",
          border: "none",
          cursor: "pointer"
        }}
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </>
  );
};

export default Home;

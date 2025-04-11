import React, { useState, useEffect, useRef } from 'react';

const CustomCursor = ({ colors }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [followerPosition, setFollowerPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // Set default colors if not provided
  const defaultColors = {
    primary: '#555555',    // Light gray (was brown)
    accent: '#4A90E2',     // Light blue (unchanged)
    light: '#F5F5F5',      // Light gray (was beige)
    dark: '#222222'        // Dark black (was dark brown)
  };

  useEffect(() => {
    let cursorTimeout;
    let followerTimeout;
    
    const onMouseMove = (e) => {
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      }, 5); // Almost immediate response for cursor
      
      clearTimeout(followerTimeout);
      followerTimeout = setTimeout(() => {
        setFollowerPosition({ x: e.clientX, y: e.clientY });
      }, 20); // Slight delay for follower to create lag effect
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseEnter = () => setIsHidden(false);
    const onMouseLeave = () => setIsHidden(true);

    // Original hover detection
    const handleElementHover = () => {
      const handleMouseEnter = (e) => {
        setIsPointer(true);
      };
      
      const handleMouseLeave = (e) => {
        setIsPointer(false);
      };

      // Add listeners to all interactive elements
      const addListeners = () => {
        const elements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], .clickable, .card, .nav-link, .logo');
        elements.forEach(el => {
          el.addEventListener('mouseenter', handleMouseEnter);
          el.addEventListener('mouseleave', handleMouseLeave);
        });
      };
      
      // Initial setup
      addListeners();
      
      // Create a mutation observer to watch for new elements
      const observer = new MutationObserver(mutations => {
        addListeners();
      });
      
      // Start observing
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      return () => observer.disconnect();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);
    
    // Set up event listeners for clickable elements
    const cleanup = handleElementHover();
    
    // Add CSS to hide the default cursor
    const style = document.createElement('style');
    style.textContent = `
      body, a, button, input, textarea, select, [role="button"], .clickable {
        cursor: none !impor#555555t;
      }
    `;
    document.head.appendChild(style);

    return () => {
      clearTimeout(cursorTimeout);
      clearTimeout(followerTimeout);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.head.removeChild(style);
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      {/* Cursor (dot) */}
      <div
        className="cursor"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: isPointer ? defaultColors.accent : defaultColors.dark,
          borderRadius: '50%',
          position: 'fixed',
          top: position.y,
          left: position.x,
          transform: 'translate(-50%, -50%) scale(' + (isClicking ? 0.7 : 1) + ')',
          opacity: isHidden ? 0 : 0.8,
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'transform 0.2s ease-out, background-color 0.3s ease, opacity 0.3s ease, width 0.2s ease, height 0.2s ease',
          mixBlendMode: 'difference'
        }}
      />
      
      {/* Cursor follower (ring) */}
      <div
        className="cursor-follower"
        style={{
          width: isPointer ? '40px' : '30px',
          height: isPointer ? '40px' : '30px',
          border: `2px solid ${isPointer ? defaultColors.accent : 'rgba(139, 90, 43, 0.5)'}`,
          borderRadius: '50%',
          position: 'fixed',
          top: followerPosition.y,
          left: followerPosition.x,
          transform: 'translate(-50%, -50%) scale(' + (isClicking ? 0.9 : 1) + ')',
          opacity: isHidden ? 0 : (isPointer ? 0.7 : 0.5),
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'transform 0.15s ease-out, width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.3s ease'
        }}
      />
    </>
  );
};

export default CustomCursor; 

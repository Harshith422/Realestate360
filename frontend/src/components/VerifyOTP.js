import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VerifyOTP = ({ email, onVerify, onSignIn }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeInput, setActiveInput] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef([]);
  
  // Set up timer for resend code
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);
  
  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  const handleChange = (e, index) => {
    const { value } = e.target;
    
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    // Update OTP state
    const newOtp = [...otp];
    
    // Handle paste event with multiple digits
    if (value.length > 1) {
      const pastedOtp = value.substring(0, 6).split('');
      for (let i = 0; i < pastedOtp.length; i++) {
        if (i + index < 6) {
          newOtp[i + index] = pastedOtp[i];
        }
      }
      setOtp(newOtp);
      
      // Focus on the next empty input or last input
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      setActiveInput(nextIndex);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else {
      // Single digit input
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Move to next input if value is entered
      if (value && index < 5) {
        setActiveInput(index + 1);
        inputRefs.current[index + 1].focus();
      }
    }
    
    // Clear any error message when user starts typing
    if (error) setError("");
  };
  
  const handleKeyDown = (e, index) => {
    // Move focus to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setActiveInput(index - 1);
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveInput(index - 1);
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1].focus();
    }
  };

  const handleVerify = async () => {
    if (otp.some(digit => digit === "")) {
      setError("Please enter all digits of the OTP");
      return;
    }
    
    const otpValue = otp.join("");
    setIsVerifying(true);
    setError("");
    
    try {
      // Make real API call to verify OTP
      const response = await fetch("http://localhost:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update success state first to show the initial success animation
        setSuccess(true);
        
        if (onVerify) onVerify();
        
        // After success animation, show the actual success popup
        setTimeout(() => {
          setShowSuccessPopup(true);
        }, 1500);
      } else {
        // Handle specific error for user already exists but not verified
        if (data.error && data.error.includes("already exists")) {
          setError("This email is already registered. Please sign in or use a different email.");
        } else {
          setError(data.error || "Verification failed. Please try again.");
        }
        
        // Clear inputs and focus on first
        setOtp(["", "", "", "", "", ""]);
        setActiveInput(0);
        inputRefs.current[0].focus();
      }
    } catch (error) {
      setError("Something went wrong! Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      // Fallback if onSignIn isn't provided
      window.location.href = "/signin";
    }
  };
  
  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setIsResending(true);
    setError(""); // Clear any previous errors
    
    try {
      // Make real API call to resend OTP
      const response = await fetch("http://localhost:5000/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTimer(60); // Reset timer
        // Show success message for resend
        setError(""); // Clear any previous errors
      } else {
        // Handle specific error cases
        if (data.error && data.error.includes("already verified")) {
          setError("This account is already verified. Please sign in.");
        } else if (data.error && data.error.includes("not found")) {
          setError("No registration found with this email. Please sign up first.");
        } else {
          setError(data.error || "Failed to resend OTP. Please try again.");
        }
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    success: {
      scale: 0.9,
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };
  
  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const popupVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    }
  };

  // Auto-verify if OTP is complete
  useEffect(() => {
    // Check if all digits are filled
    if (otp.every(digit => digit !== "") && !isVerifying && !success) {
      // Add a slight delay before auto-verification to allow user to see the completed OTP
      const timer = setTimeout(() => {
        handleVerify();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [otp]);

  return (
    <AnimatePresence mode="wait">
      {showSuccessPopup ? (
        <motion.div 
          key="success-popup"
          variants={popupVariants}
          initial="hidden"
          animate="visible"
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(139, 90, 43, 0.15)',
            padding: '40px',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              delay: 0.2 
            }}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#FF8C00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 25px'
            }}
          >
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M5 14l5 5L20 6"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            </svg>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ 
              color: '#8B5A2B', 
              marginBottom: '15px',
              fontSize: '28px',
              fontWeight: '600'
            }}
          >
            Account Successfully Created!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ 
              color: '#A67C52', 
              marginBottom: '30px',
              fontSize: '16px',
              lineHeight: 1.6
            }}
          >
            Your account has been verified and created successfully.
            You can now sign in to access your account.
          </motion.p>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ 
              backgroundColor: '#FF9D2F',
              boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
            }}
            onClick={handleSignIn}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              backgroundColor: '#FF8C00',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              padding: '14px 30px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease',
              marginTop: '10px'
            }}
          >
            Sign In
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              marginTop: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              color: '#A67C52',
              fontSize: '14px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '7px' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Your account is secured with our latest security protocols
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="otp-verification"
          key="otp-form"
          initial="hidden"
          animate="visible"
          exit="success"
          variants={containerVariants}
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(139, 90, 43, 0.15)',
            padding: '40px',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {success && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.97)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '12px'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#FF8C00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 14l5 5L20 6"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  />
                </svg>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  color: '#8B5A2B',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}
              >
                Verification Successful!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  color: '#A67C52',
                  fontSize: '16px'
                }}
              >
                Creating your account...
              </motion.p>
            </motion.div>
          )}
          
          <h2 style={{ 
            color: '#8B5A2B', 
            marginBottom: '8px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Verify OTP
          </h2>
          
          <p style={{ 
            color: '#A67C52', 
            marginBottom: '30px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Enter the 6-digit code sent to your email: {email || "your email"}
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '10px', 
            marginBottom: '30px'
          }}>
            {otp.map((digit, index) => (
              <motion.div 
                key={index}
                variants={inputVariants}
                style={{ position: 'relative' }}
              >
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  value={digit}
                  maxLength={6}
                  onChange={e => handleChange(e, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onClick={() => setActiveInput(index)}
                  style={{
                    width: '50px',
                    height: '60px',
                    fontSize: '24px',
                    textAlign: 'center',
                    border: 'none',
                    borderRadius: '12px',
                    backgroundColor: index === activeInput ? '#FFF4E9' : '#F5F5F5',
                    color: '#8B5A2B',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    boxShadow: index === activeInput 
                      ? '0 0 0 2px #FF8C00' 
                      : digit 
                        ? '0 2px 5px rgba(0, 0, 0, 0.05)' 
                        : 'none'
                  }}
                />
                <motion.div
                  animate={{
                    height: index === activeInput ? '4px' : '0px',
                    opacity: index === activeInput ? 1 : 0
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '10%',
                    width: '80%',
                    backgroundColor: '#FF8C00',
                    borderRadius: '4px'
                  }}
                />
              </motion.div>
            ))}
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: '#ff4d4f',
                fontSize: '14px',
                marginBottom: '15px',
                padding: '10px 15px',
                backgroundColor: 'rgba(255, 77, 79, 0.1)',
                borderRadius: '6px',
                display: 'inline-block',
                maxWidth: '90%'
              }}
            >
              {error}
            </motion.div>
          )}
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ 
              backgroundColor: '#FF9D2F',
              boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
            }}
            disabled={isVerifying || otp.some(digit => digit === '')}
            onClick={handleVerify}
            style={{
              backgroundColor: '#FF8C00',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              padding: '14px 30px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              opacity: isVerifying || otp.some(digit => digit === '') ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isVerifying ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    marginRight: '10px'
                  }}
                />
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </motion.button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '20px 0 0',
            fontSize: '14px',
            color: '#A67C52'
          }}>
            <p>Didn't receive the code?</p>
            <motion.button
              whileHover={{ color: '#FF8C00' }}
              disabled={timer > 0 || isResending}
              onClick={handleResendOtp}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: timer > 0 ? '#D2B48C' : '#8B5A2B',
                cursor: timer > 0 ? 'default' : 'pointer',
                marginLeft: '5px',
                fontWeight: '600',
                fontSize: '14px',
                padding: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              {isResending ? (
                <span>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(139, 90, 43, 0.3)',
                      borderTop: '2px solid #8B5A2B',
                      borderRadius: '50%',
                      marginRight: '5px'
                    }}
                  />
                  Sending...
                </span>
              ) : timer > 0 ? (
                <span>Resend in {formatTime(timer)}</span>
              ) : (
                <span>Resend Code</span>
              )}
            </motion.button>
          </div>
          
          <motion.div 
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#F5F5F5',
              marginTop: '30px',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(timer / 60) * 100}%` }}
              transition={{ duration: 1 }}
              style={{
                height: '100%',
                backgroundColor: timer < 10 ? '#ff4d4f' : '#FF8C00',
                borderRadius: '2px'
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VerifyOTP;

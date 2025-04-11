import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const OtpVerification = ({ onVerify, email, phoneNumber, resetTimer = 60 }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeInput, setActiveInput] = useState(0);
  const [timer, setTimer] = useState(resetTimer);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef([]);
  
  // Set up timer
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
    // If user pastes a full OTP, distribute across fields
    if (value.length > 1) {
      const pastedOtp = value.substring(0, 6).split('');
      for (let i = 0; i < pastedOtp.length; i++) {
        if (i + index < 6) {
          newOtp[i + index] = pastedOtp[i];
        }
      }
      setOtp(newOtp);
      // Focus on the next available input or the last one
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
    if (error) setError('');
  };
  
  const handleKeyDown = (e, index) => {
    // Move focus to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveInput(index - 1);
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveInput(index - 1);
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleVerify = async () => {
    if (otp.some(digit => digit === '')) {
      setError('Please enter all digits of the OTP');
      return;
    }
    
    const otpValue = otp.join('');
    setIsVerifying(true);
    setError('');
    
    try {
      // Simulate API verification (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, succeeds if OTP is 123456
      if (otpValue === '123456') {
        setSuccess(true);
        setTimeout(() => {
          if (onVerify) onVerify(otpValue);
        }, 1000);
      } else {
        setError('Invalid OTP code. Please try again.');
        inputRefs.current[0].focus();
        setActiveInput(0);
        setOtp(['', '', '', '', '', '']);
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setIsResending(true);
    
    try {
      // Simulate API call for resending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimer(resetTimer);
      setError('');
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
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
  
  // Container variants for animation
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
  
  // Input field variants
  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      className="otp-verification"
      initial="hidden"
      animate={success ? "success" : "visible"}
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
      {/* Success overlay */}
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
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#4A90E2',
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
            Verification Successful
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
            You will be redirected shortly...
          </motion.p>
        </motion.div>
      )}
      
      <h2 style={{ 
        color: '#8B5A2B', 
        marginBottom: '8px',
        fontSize: '28px',
        fontWeight: '600'
      }}>
        Verification Required
      </h2>
      
      <p style={{ 
        color: '#A67C52', 
        marginBottom: '30px',
        fontSize: '16px',
        lineHeight: '1.5'
      }}>
        {phoneNumber 
          ? `Enter the 6-digit code sent to your phone: ${phoneNumber}`
          : `Enter the 6-digit code sent to your email: ${email || 'your email'}`
        }
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
                backgroundColor: index === activeInput ? '#4A90E2' : '#F5F5F5',
                color: '#8B5A2B',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: index === activeInput 
                  ? '0 0 0 2px #4A90E2' 
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
                backgroundColor: '#4A90E2',
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
            marginBottom: '15px'
          }}
        >
          {error}
        </motion.div>
      )}
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ 
          backgroundColor: '#4A90E2',
          boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
        }}
        disabled={isVerifying || otp.some(digit => digit === '')}
        onClick={handleVerify}
        style={{
          backgroundColor: '#4A90E2',
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
          whileHover={{ color: '#4A90E2' }}
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
          animate={{ width: `${(timer / resetTimer) * 100}%` }}
          transition={{ duration: 1 }}
          style={{
            height: '100%',
            backgroundColor: timer < 10 ? '#ff4d4f' : '#4A90E2',
            borderRadius: '2px'
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default OtpVerification; 
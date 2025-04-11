import React, { useState } from 'react';
import OtpVerification from '../components/OtpVerification';

const OtpVerificationPage = () => {
  const [verified, setVerified] = useState(false);
  
  const handleVerify = (otpValue) => {
    console.log('OTP Verified:', otpValue);
    setVerified(true);
    
    // Redirect after verification (for demo purposes)
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F2EA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        {verified ? (
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(139, 90, 43, 0.1)'
          }}>
            <h2 style={{ color: '#8B5A2B', marginBottom: '20px' }}>
              Account Verified Successfully!
            </h2>
            <p style={{ color: '#A67C52' }}>
              Redirecting you to the homepage...
            </p>
          </div>
        ) : (
          <>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '40px',
              color: '#8B5A2B'
            }}>
              <h1 style={{ 
                fontSize: '32px', 
                marginBottom: '10px',
                fontWeight: '600'
              }}>
                Secure Authentication
              </h1>
              <p style={{ 
                fontSize: '16px',
                color: '#A67C52',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                For your security, we need to verify your identity. We've sent a 6-digit verification code to your registered contact method.
              </p>
            </div>
            
            <OtpVerification
              onVerify={handleVerify}
              email="user@example.com"
              resetTimer={60}
            />
            
            <div style={{ 
              textAlign: 'center', 
              marginTop: '30px',
              color: '#A67C52',
              fontSize: '14px'
            }}>
              <p>
                Having trouble? <a href="#" style={{ color: '#4A90E2', textDecoration: 'none', fontWeight: '600' }}>Contact Support</a>
              </p>
              
              <div style={{ marginTop: '20px', fontSize: '12px' }}>
                <p>For demo purposes, the correct OTP is: <strong>123456</strong></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationPage; 
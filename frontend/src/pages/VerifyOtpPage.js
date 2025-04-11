import React, { useState } from 'react';
import VerifyOTP from '../components/VerifyOTP';

const VerifyOtpPage = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const handleVerify = () => {
    console.log('OTP Verified!');
    // Here you would typically update your auth state
  };
  
  const handleSignIn = () => {
    setIsSigningIn(true);
    
    // Redirect to login page after a delay (for demo purposes)
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
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
        {isSigningIn ? (
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(139, 90, 43, 0.1)'
          }}>
            <h2 style={{ color: '#8B5A2B', marginBottom: '20px' }}>
              Redirecting to Sign In...
            </h2>
            <div style={{
              width: '40px',
              height: '40px',
              margin: '0 auto',
              border: '4px solid rgba(139, 90, 43, 0.1)',
              borderLeft: '4px solid #8B5A2B',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
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
                Account Verification
              </h1>
              <p style={{ 
                fontSize: '16px',
                color: '#A67C52',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                We've sent a verification code to complete your account setup. Please check your email and enter the code below.
              </p>
            </div>
            
            <VerifyOTP
              email="user@example.com"
              onVerify={handleVerify}
              onSignIn={handleSignIn}
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
                <p>For testing, assume any 6-digit code will work with the API</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyOtpPage; 
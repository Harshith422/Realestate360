import React, { useState, useEffect } from 'react';
import '../styles.css';

const AppointmentsList = ({ authToken, userType, userEmail }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [profilesData, setProfilesData] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!authToken) return;
      
      try {
        setLoading(true);
        console.log(`Fetching appointments for ${userType} (email: ${userEmail})`);
        
        // Use different endpoints based on user type
        const endpoint = userType === 'owner' ? '/appointments/owner' : '/appointments/user';
        
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        
        const data = await response.json();
        // Sort appointments by creation date (newest first)
        const sortedAppointments = data.appointments.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        console.log(`Fetched ${sortedAppointments.length} appointments for ${userType}:`, 
                    sortedAppointments.map(a => `${a.id}: user=${a.userEmail}, owner=${a.ownerEmail}`));
        
        setAppointments(sortedAppointments);
        
        // After loading appointments, fetch all profiles
        if (sortedAppointments.length > 0) {
          fetchProfilesData(sortedAppointments);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (authToken && userEmail) {
      fetchAppointments();
    } else {
      console.error('Missing required props:', { authToken: !!authToken, userEmail: !!userEmail });
    }
  }, [authToken, userType, userEmail]);
  
  // Fetch profile data for users and owners
  const fetchProfilesData = async (appointmentsList) => {
    try {
      setLoadingProfiles(true);
      
      // Extract unique email addresses to fetch
      const emails = new Set();
      
      appointmentsList.forEach(appointment => {
        emails.add(appointment.userEmail);
        emails.add(appointment.ownerEmail);
      });
      
      // Fetch profile data for each email
      const profilePromises = Array.from(emails).map(async (email) => {
        try {
          const response = await fetch(`http://localhost:5000/users/profile/${email}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            return [email, null];
          }
          
          const data = await response.json();
          return [email, data];
        } catch (error) {
          console.error(`Error fetching profile for ${email}:`, error);
          return [email, null];
        }
      });
      
      const profiles = await Promise.all(profilePromises);
      
      // Create an object with email as key and profile data as value
      const profilesMap = Object.fromEntries(profiles);
      setProfilesData(profilesMap);
      
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };
  
  const handleUpdateStatus = async (appointmentId, status, appointmentOption) => {
    try {
      const response = await fetch(`http://localhost:5000/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          selectedAppointment: appointmentOption
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      
      // Update the local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status, selectedAppointment: appointmentOption, updatedAt: new Date().toISOString() } 
            : appointment
        )
      );
      
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment status. Please try again.');
    }
  };
  
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'rejected':
        return 'status-rejected';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  // Helper function to render visitor information for property owners
  const renderVisitorInfo = (email, appointment) => {
    // Get the visitor's email directly from the appointment
    const visitorEmail = appointment.userEmail;
    
    // Get profile data if available
    const profile = profilesData[visitorEmail] || appointment.userProfile;
    
    if (!profile) {
      return (
        <div className="profile-info-card">
          <div className="profile-info-content">
            <div className="profile-info-details">
              <p><strong>Email:</strong> {visitorEmail}</p>
              <p>Additional visitor details are not available</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="profile-info-card">
        <div className="profile-info-content">
          {profile.profileImage && (
            <img 
              src={profile.profileImage} 
              alt={profile.fullName || "Visitor"} 
              className="profile-thumbnail" 
            />
          )}
          <div className="profile-info-details">
            {profile.fullName && <p><strong>Name:</strong> {profile.fullName}</p>}
            {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
            <p><strong>Email:</strong> {visitorEmail}</p>
            {profile.occupation && <p><strong>Occupation:</strong> {profile.occupation}</p>}
          </div>
        </div>
      </div>
    );
  };
  
  // Helper function to render owner information for users
  const renderOwnerInfo = (email, appointment) => {
    // Get the owner's email directly from the appointment
    const ownerEmail = appointment.ownerEmail;
    
    // Get the owner's profile data
    const profile = profilesData[ownerEmail];
    
    if (!profile) {
      return (
        <div className="profile-info-card owner-info">
          <div className="profile-info-content">
            <div className="profile-info-details">
              <p><strong>Email:</strong> {ownerEmail}</p>
              <p>Additional contact details are not available</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="profile-info-card owner-info">
        <div className="profile-info-content">
          {profile.profileImage && (
            <img 
              src={profile.profileImage} 
              alt={profile.fullName || "Property Owner"} 
              className="profile-thumbnail" 
            />
          )}
          <div className="profile-info-details">
            {profile.fullName && <p><strong>Name:</strong> {profile.fullName}</p>}
            {profile.phone && (
              <p className="contact-method">
                <strong>Phone:</strong> 
                <a href={`tel:${profile.phone}`} className="contact-link">
                  {profile.phone}
                </a>
              </p>
            )}
            <p><strong>Email:</strong> {ownerEmail}</p>
          </div>
        </div>
        <div className="owner-contact-note">
          <p><i className="fas fa-info-circle"></i> You can contact the property owner directly using the information above.</p>
        </div>
      </div>
    );
  };
  
  // Add function to handle contact request
  const handleContactRequest = async (appointmentId, requestType) => {
    try {
      // In a real implementation, you would make an API call to request contact info
      const requestText = requestType === "callback" ? 
        "Callback request sent to property owner. They will call you soon." :
        "Contact request sent to property owner. They will be notified of your request.";
      
      alert(requestText);
      
      // Mark the request in local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { 
                ...appointment, 
                contactRequested: true,
                contactRequestType: requestType,
                contactRequestedAt: new Date().toISOString()
              } 
            : appointment
        )
      );
      
      // Example API call (would need to be implemented in backend)
      /*
      const response = await fetch(`http://localhost:5000/appointments/${appointmentId}/contact-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestType: requestType
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send contact request');
      }
      */
    } catch (err) {
      console.error('Error sending contact request:', err);
      alert('Failed to send contact request. Please try again.');
    }
  };
  
  // Function to render the contact request options
  const renderContactOptions = (appointment) => {
    if (appointment.contactRequested) {
      const requestType = appointment.contactRequestType || "phone";
      const requestTime = appointment.contactRequestedAt ? 
        formatDateTime(appointment.contactRequestedAt) : "Recently";
      
      return (
        <div className="contact-request-status">
          <p className="contact-request-info">
            <span className="contact-request-icon">✓</span>
            {requestType === "callback" 
              ? `You requested a callback on ${requestTime}` 
              : `You requested contact information on ${requestTime}`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="contact-request-buttons">
        <button 
          className="btn-request-contact btn-request-callback"
          onClick={() => handleContactRequest(appointment.id, "callback")}
        >
          Request Callback
        </button>
        <p className="contact-note">Request a callback from the property owner at your convenience.</p>
      </div>
    );
  };
  
  // Add function to handle sharing contact info
  const handleShareContact = async (appointmentId) => {
    try {
      // In a real implementation, you would make an API call to share contact info
      alert("Contact information shared with the visitor. They can now see your contact details.");
      
      // Mark the contact info as shared in local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { 
                ...appointment, 
                contactInfoShared: true,
                contactInfoSharedAt: new Date().toISOString()
              } 
            : appointment
        )
      );
      
      // Example API call (would need to be implemented)
      /*
      const response = await fetch(`http://localhost:5000/appointments/${appointmentId}/share-contact`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to share contact information');
      }
      */
    } catch (err) {
      console.error('Error sharing contact information:', err);
      alert('Failed to share contact information. Please try again.');
    }
  };
  
  // Function to render contact requests for owners
  const renderContactRequests = (appointment) => {
    if (!appointment.contactRequested) {
      return null;
    }
    
    const requestType = appointment.contactRequestType || "phone";
    const requestTime = appointment.contactRequestedAt ? 
      formatDateTime(appointment.contactRequestedAt) : "Recently";
    
    return (
      <div className="contact-request-alert">
        <p className="contact-request-message">
          <span className="contact-request-icon-alert">!</span>
          {requestType === "callback" 
            ? `Visitor requested a callback on ${requestTime}` 
            : `Visitor requested your contact information on ${requestTime}`}
        </p>
        
        {!appointment.contactInfoShared ? (
          <button 
            className="btn-share-contact"
            onClick={() => handleShareContact(appointment.id)}
          >
            Share Contact Information
          </button>
        ) : (
          <p className="contact-shared-confirmation">
            <span className="contact-shared-icon">✓</span>
            You shared your contact information on {formatDateTime(appointment.contactInfoSharedAt)}
          </p>
        )}
      </div>
    );
  };
  
  const renderAppointmentDetails = (appointment) => {
    console.log(`Rendering appointment ${appointment.id}, userType=${userType}, user=${appointment.userEmail}, owner=${appointment.ownerEmail}`);
    
    // Double-check to confirm what role we're displaying
    const isViewingAsUser = userType === 'user';
    const isViewingAsOwner = userType === 'owner';
    
    return (
      <div className="appointment-details">
        <div className="property-info">
          <h4>{appointment.property?.name || 'Property'}</h4>
          <p className="address">{appointment.property?.location || 'Location not available'}</p>
        </div>
        
        <div className="appointment-time">
          <div className="time-label">Requested on:</div>
          <div className="time-value">{formatDateTime(appointment.createdAt)}</div>
          
          {appointment.status === 'confirmed' && appointment.selectedAppointment && (
            <div className="confirmed-time">
              <div className="time-label">Confirmed Time:</div>
              <div className="time-value">{appointment.selectedAppointment.formatted}</div>
            </div>
          )}
        </div>
        
        <div className="contact-information">
          {isViewingAsUser ? (
            // When the user views their booking, show the property owner's info
            <div>
              <h4>Property Owner Information</h4>
              {renderOwnerInfo(appointment.ownerEmail, appointment)}
            </div>
          ) : (
            // When property owner views a booking request, show the visitor's info
            <div>
              <h4>Visitor Information</h4>
              {renderVisitorInfo(appointment.userEmail, appointment)}
            </div>
          )}
        </div>
        
        {appointment.message && (
          <div className="appointment-message">
            <h5>Message from {isViewingAsOwner ? 'Visitor' : 'You'}</h5>
            <p className="message-text">{appointment.message}</p>
          </div>
        )}
        
        <div className="appointment-options">
          <strong>Preferred Times:</strong>
          <ul>
            {appointment.appointments.map((option, index) => (
              <li key={index}>
                {option.formatted}
                {isViewingAsOwner && appointment.status === 'pending' && (
                  <button 
                    className="select-time-btn"
                    onClick={() => setSelectedAppointment({ id: appointment.id, option })}
                  >
                    Select
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="appointment-actions">
          {isViewingAsOwner && appointment.status === 'pending' && (
            <button 
              className="btn-reject"
              onClick={() => handleUpdateStatus(appointment.id, 'rejected')}
            >
              Reject
            </button>
          )}
          {isViewingAsUser && appointment.status === 'pending' && (
            <button 
              className="btn-cancel-appointment"
              onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
            >
              Cancel Request
            </button>
          )}
          {isViewingAsUser && appointment.status === 'confirmed' && (
            <button 
              className="btn-cancel-appointment"
              onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
            >
              Cancel Appointment
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Fix the filter function with better logging and explicit checks
  const filterAppointments = (appointments, userType, currentUserEmail) => {
    console.log('Filtering appointments with userType:', userType, 'currentUserEmail:', currentUserEmail);
    
    if (!currentUserEmail) {
      console.error('Missing currentUserEmail in filterAppointments');
      return [];
    }
    
    const filtered = appointments.filter(appointment => {
      // Debug info for each appointment
      console.log(`Appointment ${appointment.id}: userEmail=${appointment.userEmail}, ownerEmail=${appointment.ownerEmail}, currentUser=${currentUserEmail}`);
      
      if (userType === 'user') {
        // In My Appointments tab, only show appointments where current user is the requester
        const isUsersAppointment = appointment.userEmail === currentUserEmail;
        return isUsersAppointment;
      } else if (userType === 'owner') {
        // In Visit Requests tab, only show appointments where current user is the property owner
        const isOwnersProperty = appointment.ownerEmail === currentUserEmail;
        return isOwnersProperty;
      }
      return false;
    });

    console.log(`Filtered appointments for ${userType}: ${filtered.length} out of ${appointments.length}`);
    return filtered;
  };
  
  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  // Replace the existing filteredAppointments line with this:
  const filteredAppointments = filterAppointments(appointments, userType, userEmail);

  return (
    <div className="appointments-container">
      <h3>
        {userType === 'owner' 
          ? 'Property Visit Requests (from visitors)' 
          : 'My Property Visit Appointments'}
      </h3>
      
      {filteredAppointments.length === 0 ? (
        <p className="empty-message">
          {userType === 'owner' 
            ? "You don't have any property visit requests yet." 
            : "You haven't scheduled any property visits yet."}
        </p>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map(appointment => (
            <div 
              key={appointment.id} 
              className={`appointment-card ${appointment.status}`}
            >
              <div className="appointment-header">
                <h4>{appointment.property.name}</h4>
                <span className={`appointment-status ${getStatusBadgeClass(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
              
              {renderAppointmentDetails(appointment)}
            </div>
          ))}
        </div>
      )}
      
      {/* Confirmation Modal */}
      {selectedAppointment && (
        <div className="modal-overlay">
          <div className="appointment-modal">
            <h4>Confirm Appointment</h4>
            <p>
              Are you sure you want to confirm this appointment for:<br />
              <strong>{selectedAppointment.option.formatted}</strong>?
            </p>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setSelectedAppointment(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm"
                onClick={() => handleUpdateStatus(
                  selectedAppointment.id,
                  'confirmed',
                  selectedAppointment.option
                )}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList; 
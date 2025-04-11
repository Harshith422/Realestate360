const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

// Initialize AWS S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

// POST - Create a new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { property, appointments, message, userEmail, userProfile } = req.body;
    
    // Verify the user is authenticated and matches the request
    if (req.user.email !== userEmail) {
      return res.status(403).json({ message: "Unauthorized - Email does not match authenticated user" });
    }
    
    // Create a unique ID for the appointment
    const appointmentId = uuidv4();
    
    // Create base appointment object
    const baseAppointmentData = {
      id: appointmentId,
      property,
      appointments,
      message,
      userEmail,
      ownerEmail: property.ownerEmail,
      createdAt: new Date().toISOString(),
      status: "pending", // pending, confirmed, rejected
      updatedAt: new Date().toISOString()
    };
    
    // Create user-specific view (with role=user)
    const userAppointmentData = {
      ...baseAppointmentData,
      role: 'user', // This indicates the viewer is the user who made the appointment
      userProfile: userProfile // Include user's own profile
    };
    
    // Create owner-specific view (with role=owner)
    const ownerAppointmentData = {
      ...baseAppointmentData,
      role: 'owner', // This indicates the viewer is the property owner
      userProfile: userProfile // Include user profile for owner to see
    };
    
    // Define the folder structure in S3 for access control
    const userKey = `appointments/user/${userEmail}/${appointmentId}.json`;
    const ownerKey = `appointments/owner/${property.ownerEmail}/${appointmentId}.json`;
    
    // Upload to S3 for user access - user view
    await s3.putObject({
      Bucket: bucketName,
      Key: userKey,
      Body: JSON.stringify(userAppointmentData),
      ContentType: 'application/json'
    }).promise();
    
    // Upload to S3 for owner access - owner view
    await s3.putObject({
      Bucket: bucketName,
      Key: ownerKey,
      Body: JSON.stringify(ownerAppointmentData),
      ContentType: 'application/json'
    }).promise();
    
    res.status(201).json({ 
      message: "Appointment created successfully",
      appointmentId
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: "Server error while creating appointment" });
  }
});

// GET - Fetch user's appointments
router.get('/user', auth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // List all objects in the user's appointment folder
    const listParams = {
      Bucket: bucketName,
      Prefix: `appointments/user/${userEmail}/`
    };
    
    const listedObjects = await s3.listObjectsV2(listParams).promise();
    
    if (listedObjects.Contents.length === 0) {
      return res.json({ appointments: [] });
    }
    
    // Fetch each appointment
    const appointments = await Promise.all(
      listedObjects.Contents.map(async (object) => {
        const data = await s3.getObject({
          Bucket: bucketName,
          Key: object.Key
        }).promise();
        
        return JSON.parse(data.Body.toString());
      })
    );
    
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: "Server error while fetching appointments" });
  }
});

// GET - Fetch owner's appointments
router.get('/owner', auth, async (req, res) => {
  try {
    const ownerEmail = req.user.email;
    
    // List all objects in the owner's appointment folder
    const listParams = {
      Bucket: bucketName,
      Prefix: `appointments/owner/${ownerEmail}/`
    };
    
    const listedObjects = await s3.listObjectsV2(listParams).promise();
    
    if (listedObjects.Contents.length === 0) {
      return res.json({ appointments: [] });
    }
    
    // Fetch each appointment
    const appointments = await Promise.all(
      listedObjects.Contents.map(async (object) => {
        const data = await s3.getObject({
          Bucket: bucketName,
          Key: object.Key
        }).promise();
        
        return JSON.parse(data.Body.toString());
      })
    );
    
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching owner appointments:', error);
    res.status(500).json({ message: "Server error while fetching appointments" });
  }
});

// PATCH - Update appointment status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, selectedAppointment } = req.body;
    const userEmail = req.user.email;
    
    // Different validation based on who is updating the appointment
    if (status === 'cancelled') {
      // Only the user who created the appointment can cancel it
      const userKey = `appointments/user/${userEmail}/${id}.json`;
      
      try {
        // Get the appointment data
        const data = await s3.getObject({
          Bucket: bucketName,
          Key: userKey
        }).promise();
        
        const appointmentData = JSON.parse(data.Body.toString());
        
        // Verify user is the appointment creator
        if (appointmentData.userEmail !== userEmail) {
          return res.status(403).json({ message: "Unauthorized - Not the appointment creator" });
        }
        
        // Update the appointment - maintain the role information
        const updatedUserAppointment = {
          ...appointmentData,
          status,
          updatedAt: new Date().toISOString()
        };
        
        // Get the owner key
        const ownerKey = `appointments/owner/${appointmentData.ownerEmail}/${id}.json`;
        
        // Get owner's copy of the appointment
        const ownerData = await s3.getObject({
          Bucket: bucketName,
          Key: ownerKey
        }).promise();
        
        const ownerAppointmentData = JSON.parse(ownerData.Body.toString());
        
        // Update owner's copy while preserving the role
        const updatedOwnerAppointment = {
          ...ownerAppointmentData,
          status,
          updatedAt: new Date().toISOString()
        };
        
        // Update in both locations
        await s3.putObject({
          Bucket: bucketName,
          Key: userKey,
          Body: JSON.stringify(updatedUserAppointment),
          ContentType: 'application/json'
        }).promise();
        
        await s3.putObject({
          Bucket: bucketName,
          Key: ownerKey,
          Body: JSON.stringify(updatedOwnerAppointment),
          ContentType: 'application/json'
        }).promise();
        
        res.json({ 
          message: `Appointment cancelled`,
          appointment: updatedUserAppointment
        });
      } catch (error) {
        if (error.code === 'NoSuchKey') {
          return res.status(404).json({ message: "Appointment not found" });
        }
        throw error;
      }
    } else if (status === 'confirmed' || status === 'rejected') {
      // Only the property owner can confirm or reject
      // Get the appointment from owner's perspective
      const ownerKey = `appointments/owner/${userEmail}/${id}.json`;
      
      try {
        // Get the appointment data
        const data = await s3.getObject({
          Bucket: bucketName,
          Key: ownerKey
        }).promise();
        
        const ownerAppointmentData = JSON.parse(data.Body.toString());
        
        // Verify the current user is the property owner
        if (ownerAppointmentData.ownerEmail !== userEmail) {
          return res.status(403).json({ message: "Unauthorized - Not the property owner" });
        }
        
        // Update the appointment with selectedAppointment if confirming
        const updatedOwnerAppointment = {
          ...ownerAppointmentData,
          status,
          updatedAt: new Date().toISOString()
        };
        
        if (status === 'confirmed' && selectedAppointment) {
          updatedOwnerAppointment.selectedAppointment = selectedAppointment;
        }
        
        // Get the user's copy of the appointment
        const userKey = `appointments/user/${ownerAppointmentData.userEmail}/${id}.json`;
        const userData = await s3.getObject({
          Bucket: bucketName,
          Key: userKey
        }).promise();
        
        const userAppointmentData = JSON.parse(userData.Body.toString());
        
        // Update user's copy while preserving the role
        const updatedUserAppointment = {
          ...userAppointmentData,
          status,
          updatedAt: new Date().toISOString()
        };
        
        if (status === 'confirmed' && selectedAppointment) {
          updatedUserAppointment.selectedAppointment = selectedAppointment;
        }
        
        // Update in both locations
        await s3.putObject({
          Bucket: bucketName,
          Key: ownerKey,
          Body: JSON.stringify(updatedOwnerAppointment),
          ContentType: 'application/json'
        }).promise();
        
        await s3.putObject({
          Bucket: bucketName,
          Key: userKey,
          Body: JSON.stringify(updatedUserAppointment),
          ContentType: 'application/json'
        }).promise();
        
        res.json({
          message: `Appointment ${status}`,
          appointment: updatedOwnerAppointment
        });
      } catch (error) {
        if (error.code === 'NoSuchKey') {
          return res.status(404).json({ message: "Appointment not found" });
        }
        throw error;
      }
    } else {
      return res.status(400).json({ message: "Invalid status update request" });
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: "Server error while updating appointment" });
  }
});

// POST - Send contact request to property owner
router.post('/:id/contact-request', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { requestType } = req.body; // 'phone' or 'callback'
    const userEmail = req.user.email;
    
    // Get the appointment 
    const userKey = `appointments/user/${userEmail}/${id}.json`;
    
    try {
      // Get the appointment data
      const data = await s3.getObject({
        Bucket: bucketName,
        Key: userKey
      }).promise();
      
      const appointmentData = JSON.parse(data.Body.toString());
      
      // Verify user is the appointment creator
      if (appointmentData.userEmail !== userEmail) {
        return res.status(403).json({ message: "Unauthorized - Not the appointment creator" });
      }
      
      // Update the appointment with contact request info
      const updatedAppointment = {
        ...appointmentData,
        contactRequested: true,
        contactRequestType: requestType || 'phone',
        contactRequestedAt: new Date().toISOString()
      };
      
      // Get the owner key
      const ownerKey = `appointments/owner/${appointmentData.ownerEmail}/${id}.json`;
      
      // Update in both locations
      await s3.putObject({
        Bucket: bucketName,
        Key: userKey,
        Body: JSON.stringify(updatedAppointment),
        ContentType: 'application/json'
      }).promise();
      
      await s3.putObject({
        Bucket: bucketName,
        Key: ownerKey,
        Body: JSON.stringify(updatedAppointment),
        ContentType: 'application/json'
      }).promise();
      
      res.json({ 
        message: `Contact request sent to property owner`,
        appointment: updatedAppointment
      });
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ message: "Appointment not found" });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error sending contact request:', error);
    res.status(500).json({ message: "Server error while sending contact request" });
  }
});

// PATCH - Share contact info with user (owner only)
router.patch('/:id/share-contact', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const ownerEmail = req.user.email;
    
    // Check if appointment exists for this owner
    const ownerKey = `appointments/owner/${ownerEmail}/${id}.json`;
    
    try {
      // Get the appointment data
      const data = await s3.getObject({
        Bucket: bucketName,
        Key: ownerKey
      }).promise();
      
      const appointmentData = JSON.parse(data.Body.toString());
      
      // Verify owner
      if (appointmentData.ownerEmail !== ownerEmail) {
        return res.status(403).json({ message: "Unauthorized - Not the property owner" });
      }
      
      // Update the appointment
      const updatedAppointment = {
        ...appointmentData,
        contactInfoShared: true,
        contactInfoSharedAt: new Date().toISOString()
      };
      
      // Get the user key
      const userKey = `appointments/user/${appointmentData.userEmail}/${id}.json`;
      
      // Update in both locations
      await s3.putObject({
        Bucket: bucketName,
        Key: ownerKey,
        Body: JSON.stringify(updatedAppointment),
        ContentType: 'application/json'
      }).promise();
      
      await s3.putObject({
        Bucket: bucketName,
        Key: userKey,
        Body: JSON.stringify(updatedAppointment),
        ContentType: 'application/json'
      }).promise();
      
      res.json({ 
        message: `Contact information shared with user`,
        appointment: updatedAppointment
      });
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ message: "Appointment not found" });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error sharing contact info:', error);
    res.status(500).json({ message: "Server error while sharing contact information" });
  }
});

// Migration endpoint to add role field to existing appointments
router.post('/migrate-roles', auth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Only allow admins or for testing
    if (!req.user.isAdmin && userEmail !== 'test@example.com') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // 1. Get all user appointments
    const userListParams = {
      Bucket: bucketName,
      Prefix: 'appointments/user/'
    };
    
    const userObjects = await s3.listObjectsV2(userListParams).promise();
    
    // Process user appointments
    const userMigrations = await Promise.all(
      userObjects.Contents.map(async (object) => {
        try {
          const data = await s3.getObject({
            Bucket: bucketName,
            Key: object.Key
          }).promise();
          
          const appointment = JSON.parse(data.Body.toString());
          
          // Skip if already has role
          if (appointment.role) {
            return { key: object.Key, status: 'skipped' };
          }
          
          // Add user role
          const updatedAppointment = {
            ...appointment,
            role: 'user'
          };
          
          // Update in S3
          await s3.putObject({
            Bucket: bucketName,
            Key: object.Key,
            Body: JSON.stringify(updatedAppointment),
            ContentType: 'application/json'
          }).promise();
          
          return { key: object.Key, status: 'updated' };
        } catch (error) {
          console.error(`Error migrating user appointment ${object.Key}:`, error);
          return { key: object.Key, status: 'error', error: error.message };
        }
      })
    );
    
    // 2. Get all owner appointments
    const ownerListParams = {
      Bucket: bucketName,
      Prefix: 'appointments/owner/'
    };
    
    const ownerObjects = await s3.listObjectsV2(ownerListParams).promise();
    
    // Process owner appointments
    const ownerMigrations = await Promise.all(
      ownerObjects.Contents.map(async (object) => {
        try {
          const data = await s3.getObject({
            Bucket: bucketName,
            Key: object.Key
          }).promise();
          
          const appointment = JSON.parse(data.Body.toString());
          
          // Skip if already has role
          if (appointment.role) {
            return { key: object.Key, status: 'skipped' };
          }
          
          // Add owner role
          const updatedAppointment = {
            ...appointment,
            role: 'owner'
          };
          
          // Update in S3
          await s3.putObject({
            Bucket: bucketName,
            Key: object.Key,
            Body: JSON.stringify(updatedAppointment),
            ContentType: 'application/json'
          }).promise();
          
          return { key: object.Key, status: 'updated' };
        } catch (error) {
          console.error(`Error migrating owner appointment ${object.Key}:`, error);
          return { key: object.Key, status: 'error', error: error.message };
        }
      })
    );
    
    res.json({
      message: "Migration completed",
      userMigrations,
      ownerMigrations
    });
  } catch (error) {
    console.error('Error in migration:', error);
    res.status(500).json({ message: "Server error during migration", error: error.message });
  }
});

module.exports = router; 
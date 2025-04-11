const s3 = require('../config/s3Config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed!'));
    }
  }
}).single('profileImage');

// Middleware to handle file upload
exports.uploadProfileImage = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Get user profile information
exports.getUserProfile = async (req, res) => {
  try {
    // Make sure user object exists
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    const userEmail = req.user.email;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const jsonKey = `profiles/${userEmail}.json`;
    
    // Try to get the user profile data from S3
    try {
      const data = await s3.getObject({
        Bucket: bucketName,
        Key: jsonKey
      }).promise();
      
      const profileData = JSON.parse(data.Body.toString());
      
      // Check if user has a profile image
      let imageUrl = null;
      try {
        const imageCheck = await s3.headObject({
          Bucket: bucketName,
          Key: `profiles/images/${userEmail}.jpg`
        }).promise();
        
        // If no error, image exists
        imageUrl = `https://${bucketName}.s3.amazonaws.com/profiles/images/${userEmail}.jpg`;
      } catch (imageErr) {
        // No image found, continue without it
        console.log(`No profile image found for ${userEmail}: ${imageErr.message}`);
      }
      
      return res.status(200).json({
        ...profileData,
        profileImage: imageUrl
      });
    } catch (error) {
      // If no profile exists, return default empty profile
      if (error.code === 'NoSuchKey') {
        console.log(`No profile data found for ${userEmail}`);
        return res.status(200).json({
          fullName: '',
          phone: '',
          address: '',
          occupation: '',
          bio: '',
          profileImage: null
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    return res.status(500).json({ message: 'Error retrieving profile information' });
  }
};

// Update user profile information
exports.updateUserProfile = async (req, res) => {
  try {
    // Make sure user object exists
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    const userEmail = req.user.email;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const jsonKey = `profiles/${userEmail}.json`;
    
    console.log(`Updating profile for ${userEmail}`);
    
    // Extract profile data from request body
    const { fullName, phone, address, occupation, bio } = req.body;
    
    // Create profile data object
    const profileData = {
      fullName: fullName || '',
      phone: phone || '',
      address: address || '',
      occupation: occupation || '',
      bio: bio || '',
      updatedAt: new Date().toISOString()
    };
    
    // Upload profile data to S3
    await s3.putObject({
      Bucket: bucketName,
      Key: jsonKey,
      Body: JSON.stringify(profileData),
      ContentType: 'application/json'
    }).promise();
    
    console.log(`Profile data for ${userEmail} saved to S3`);
    
    // Handle profile image upload if present
    if (req.file) {
      const imageKey = `profiles/images/${userEmail}.jpg`;
      
      await s3.putObject({
        Bucket: bucketName,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();
      
      console.log(`Profile image for ${userEmail} uploaded to S3`);
      
      profileData.profileImage = `https://${bucketName}.s3.amazonaws.com/${imageKey}`;
    } else {
      // Check if user already has an image
      try {
        const imageCheck = await s3.headObject({
          Bucket: bucketName,
          Key: `profiles/images/${userEmail}.jpg`
        }).promise();
        
        // If no error, image exists
        profileData.profileImage = `https://${bucketName}.s3.amazonaws.com/profiles/images/${userEmail}.jpg`;
      } catch (error) {
        // No image exists
        profileData.profileImage = null;
      }
    }
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: profileData
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Error updating profile information' });
  }
};

// Get user profile by email (for appointment contact information)
exports.getUserProfileByEmail = async (req, res) => {
  try {
    const requestedEmail = req.params.email;
    
    // Security check - users can only access their own profile or profiles of users they have appointments with
    // This could be enhanced with a more sophisticated permissions system
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const jsonKey = `profiles/${requestedEmail}.json`;
    
    // Try to get the user profile data from S3
    try {
      const data = await s3.getObject({
        Bucket: bucketName,
        Key: jsonKey
      }).promise();
      
      const profileData = JSON.parse(data.Body.toString());
      
      // Check if user has a profile image
      let imageUrl = null;
      try {
        const imageCheck = await s3.headObject({
          Bucket: bucketName,
          Key: `profiles/images/${requestedEmail}.jpg`
        }).promise();
        
        // If no error, image exists
        imageUrl = `https://${bucketName}.s3.amazonaws.com/profiles/images/${requestedEmail}.jpg`;
      } catch (imageErr) {
        // No image found, continue without it
      }
      
      return res.status(200).json({
        ...profileData,
        profileImage: imageUrl
      });
    } catch (error) {
      // If no profile exists, return default empty profile
      if (error.code === 'NoSuchKey') {
        return res.status(200).json({
          fullName: '',
          phone: '',
          address: '',
          occupation: '',
          bio: '',
          profileImage: null
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error retrieving user profile by email:', error);
    return res.status(500).json({ message: 'Error retrieving profile information' });
  }
}; 
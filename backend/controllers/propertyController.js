const s3 = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get list of properties from S3
exports.getProperties = async (req, res) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: 'properties/'
    };

    const s3Data = await s3.listObjectsV2(params).promise();
    
    // Filter only for JSON files containing property metadata
    const propertyFiles = s3Data.Contents.filter(item => 
      item.Key.endsWith('.json')
    );
    
    // Fetch each property's metadata
    const propertiesPromises = propertyFiles.map(async (file) => {
      const data = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: file.Key
      }).promise();
      
      return JSON.parse(data.Body.toString());
    });
    
    const properties = await Promise.all(propertiesPromises);
    
    res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties', error: error.message });
  }
};

// Get a single property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    
    try {
      const data = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `properties/${id}.json`
      }).promise();
      
      const property = JSON.parse(data.Body.toString());
      res.status(200).json(property);
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ message: 'Property not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property', error: error.message });
  }
};

// Upload property with multiple images to S3
exports.uploadProperty = async (req, res) => {
  try {
    // Check if user exists in the request (set by auth middleware)
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'You must be logged in to upload a property' });
    }
    
    // Extract common fields
    const { 
      name, 
      description, 
      price, 
      location, 
      propertyType,
      coordinates
    } = req.body;
    
    // Handle multiple image files
    const imageFiles = req.files;
    
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ message: 'At least one image file is required' });
    }
    
    const propertyId = uuidv4();
    const imageUrls = [];
    
    // Upload each image to S3
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const imageKey = `properties/images/${propertyId}-${i}-${file.originalname.replace(/\s+/g, '-')}`;
      
      await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: imageKey,
        Body: file.buffer,
        ContentType: file.mimetype
      }).promise();
      
      // Generate image URL
      const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
      imageUrls.push(imageUrl);
    }
    
    // Parse coordinates if provided
    let parsedCoordinates = null;
    if (coordinates) {
      try {
        if (typeof coordinates === 'string') {
          parsedCoordinates = JSON.parse(coordinates);
        } else {
          parsedCoordinates = coordinates;
        }
      } catch (error) {
        console.error('Error parsing coordinates:', error);
      }
    }
    
    // Create property metadata based on property type
    let propertyData = {
      id: propertyId,
      name,
      description,
      price,
      location,
      coordinates: parsedCoordinates,
      propertyType,
      images: imageUrls,
      createdAt: new Date().toISOString(),
      ownerEmail: req.user.email // Store the email of the user who created the property
    };
    
    // Add property type specific fields
    if (propertyType === 'flat') {
      propertyData = {
        ...propertyData,
        area: req.body.area,
        bedrooms: parseInt(req.body.bedrooms, 10) || 0,
        bathrooms: parseInt(req.body.bathrooms, 10) || 0
      };
    } else if (propertyType === 'land') {
      propertyData = {
        ...propertyData,
        landArea: req.body.landArea,
        landType: req.body.landType,
        legalClearance: req.body.legalClearance
      };
    }
    
    // Upload property metadata to S3
    const metadataKey = `properties/${propertyId}.json`;
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(propertyData),
      ContentType: 'application/json'
    }).promise();
    
    res.status(201).json({ 
      message: 'Property uploaded successfully',
      property: propertyData
    });
  } catch (error) {
    console.error('Error uploading property:', error);
    res.status(500).json({ message: 'Failed to upload property', error: error.message });
  }
};

// Update property details and/or images
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    
    // Check if user is authenticated
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'You must be logged in to update a property' });
    }
    
    try {
      // First retrieve the existing property to check ownership
      const existingProperty = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `properties/${id}.json`
      }).promise();
      
      const propertyData = JSON.parse(existingProperty.Body.toString());
      
      // Check if the authenticated user is the owner
      if (propertyData.ownerEmail !== req.user.email) {
        return res.status(403).json({ 
          message: 'You are not authorized to update this property' 
        });
      }
      
      // Extract form fields from request
      const { 
        name, 
        description, 
        price, 
        location, 
        propertyType,
        coordinates,
        ownerEmail
      } = req.body;
      
      // Parse coordinates if provided
      let parsedCoordinates = propertyData.coordinates;
      if (coordinates) {
        try {
          if (typeof coordinates === 'string') {
            parsedCoordinates = JSON.parse(coordinates);
          } else {
            parsedCoordinates = coordinates;
          }
        } catch (error) {
          console.error('Error parsing coordinates:', error);
        }
      }
      
      // Process existing images from request
      let existingImages = [];
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch (e) {
          console.error('Error parsing existingImages:', e);
        }
      }
      
      // Process new image uploads
      const imageFiles = req.files || [];
      const newImageUrls = [];
      
      // Upload each new image to S3
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imageKey = `properties/images/${id}-${new Date().getTime()}-${i}-${file.originalname.replace(/\s+/g, '-')}`;
        
        await s3.upload({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: imageKey,
          Body: file.buffer,
          ContentType: file.mimetype
        }).promise();
        
        // Generate image URL
        const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
        newImageUrls.push(imageUrl);
      }
      
      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];
      
      // Update property metadata based on property type
      let updatedPropertyData = {
        ...propertyData,
        name: name || propertyData.name,
        description: description || propertyData.description,
        price: price || propertyData.price,
        location: location || propertyData.location,
        coordinates: parsedCoordinates,
        propertyType: propertyType || propertyData.propertyType,
        images: allImages,
        updatedAt: new Date().toISOString(),
      };
      
      // Update property type specific fields
      if (updatedPropertyData.propertyType === 'flat') {
        updatedPropertyData = {
          ...updatedPropertyData,
          area: req.body.area || propertyData.area,
          bedrooms: parseInt(req.body.bedrooms, 10) || propertyData.bedrooms || 0,
          bathrooms: parseInt(req.body.bathrooms, 10) || propertyData.bathrooms || 0
        };
      } else if (updatedPropertyData.propertyType === 'land') {
        updatedPropertyData = {
          ...updatedPropertyData,
          landArea: req.body.landArea || propertyData.landArea,
          landType: req.body.landType || propertyData.landType,
          legalClearance: req.body.legalClearance || propertyData.legalClearance
        };
      }
      
      // Upload updated property metadata to S3 - this completely overwrites the existing JSON file
      await s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `properties/${id}.json`,
        Body: JSON.stringify(updatedPropertyData),
        ContentType: 'application/json'
      }).promise();
      
      res.status(200).json({ 
        message: 'Property updated successfully',
        property: updatedPropertyData
      });
      
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ message: 'Property not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Failed to update property', error: error.message });
  }
};

// Delete a property and its images
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    
    // Check if user is authenticated
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'You must be logged in to delete a property' });
    }
    
    // Get the property metadata to check ownership
    try {
      const propertyData = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `properties/${id}.json`
      }).promise();
      
      const property = JSON.parse(propertyData.Body.toString());
      
      // Check if the authenticated user is the owner
      if (property.ownerEmail !== req.user.email) {
        return res.status(403).json({ 
          message: 'You are not authorized to delete this property' 
        });
      }
      
      // List all objects with the property ID prefix to find images
      const listParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Prefix: `properties/images/${id}`
      };
      
      const listedObjects = await s3.listObjectsV2(listParams).promise();
      
      if (listedObjects.Contents.length === 0) {
        console.log('No images found for property:', id);
      } else {
        // Delete all associated images
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Delete: { Objects: [] }
        };
        
        listedObjects.Contents.forEach(({ Key }) => {
          deleteParams.Delete.Objects.push({ Key });
        });
        
        await s3.deleteObjects(deleteParams).promise();
      }
      
      // Delete the property metadata
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `properties/${id}.json`
      }).promise();
      
      res.status(200).json({ 
        message: 'Property deleted successfully' 
      });
      
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ message: 'Property not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Failed to delete property', error: error.message });
  }
};

// Export multer middleware for route use
exports.uploadMiddleware = upload.array('images', 10); // Allow up to 10 images 
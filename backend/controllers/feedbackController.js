const s3 = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');

// Store feedback in S3
exports.storeFeedback = async (req, res) => {
  try {
    const { feedback, name, email, rating, selectedTopics } = req.body;
    
    // Create feedback object
    const feedbackData = {
      id: uuidv4(),
      feedback,
      name: name || 'Anonymous',
      email: email || 'No email provided',
      rating,
      selectedTopics,
      createdAt: new Date().toISOString()
    };
    
    // Upload feedback to S3
    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `feedback/${feedbackData.id}.json`,
      Body: JSON.stringify(feedbackData),
      ContentType: 'application/json'
    }).promise();
    
    res.status(201).json({ 
      message: 'Feedback stored successfully',
      feedback: feedbackData
    });
  } catch (error) {
    console.error('Error storing feedback:', error);
    res.status(500).json({ message: 'Failed to store feedback', error: error.message });
  }
};

// Get all feedback (admin only)
exports.getFeedback = async (req, res) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: 'feedback/'
    };

    const s3Data = await s3.listObjectsV2(params).promise();
    
    // Filter only for JSON files containing feedback
    const feedbackFiles = s3Data.Contents.filter(item => 
      item.Key.endsWith('.json')
    );
    
    // Fetch each feedback's data
    const feedbackPromises = feedbackFiles.map(async (file) => {
      const data = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: file.Key
      }).promise();
      
      return JSON.parse(data.Body.toString());
    });
    
    const feedback = await Promise.all(feedbackPromises);
    
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
}; 
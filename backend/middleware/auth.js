const jwt = require('jsonwebtoken');

// Middleware to check if user is authenticated
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      // Verify the token (this is a simplified version)
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.email) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Add user information to request object
      req.user = {
        email: decoded.email,
        sub: decoded.sub
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

module.exports = auth; 
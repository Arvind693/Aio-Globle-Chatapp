const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Decode token to get user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find the user in the User collection
      let user = await User.findById(decoded.id).select('-password');
      let admin = null;

      // If not found in User, check the Admin collection
      if (!user) {
        admin = await Admin.findById(decoded.id).select('-password');
      }

      // If neither user nor admin is found, return an error
      if (!user && !admin) {
        return res.status(401).json({ error: 'Not authorized, user/admin not found' });
      }

      // Attach user or admin to request object
      req.user = user || admin;
      req.isAdmin = !!admin; // Set isAdmin flag if an admin is authenticated

      next(); // Proceed to the next middleware
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

module.exports = protect;

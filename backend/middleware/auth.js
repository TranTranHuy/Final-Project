// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get the token from the 'x-auth-token' header (the frontend will send this token when calling the API)
  const token = req.header('x-auth-token');

  // If no token is provided → reject access
  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  try {
    // Token verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded.user; // Save user information to the request for later use (e.g., req.user.id, req.user.role)
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
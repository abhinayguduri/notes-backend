const JWT = require('jsonwebtoken');
const User = require('../models/user.schema')


const AuthCheck = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({ error: 'please login first.' });
    }
    JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};



module.exports = { AuthCheck };

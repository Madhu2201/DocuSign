import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = {
      _id: decoded.userId,
      email: decoded.email, // example, add more fields as needed
      role: decoded.role,
    }; 
    // Optional shortcut for ID only
    // req.user_id = decoded.userId;   
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware for admin-only access
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
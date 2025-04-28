import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

// Custom type for express middleware that may return responses
type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Define the token payload structure
interface TokenPayload {
  userId: number;
  username: string;
  userType: string;
}

// Middleware to authenticate token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Extract token from Authorization header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      // Add user data to request
      (req as any).userId = decoded.userId;
      (req as any).username = decoded.username;
      (req as any).userType = decoded.userType;
      
      // Continue to route handler
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userType = (req as any).userType;
    
    if (!userType || userType !== 'Administrator') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to verify user's own resource or admin
export const verifyOwnership = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userType } = req as any;
    const requestedUserId = parseInt(req.params.id, 10);
    
    // Allow if user is admin or accessing own resource
    if (userType === 'Administrator' || userId === requestedUserId) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Access denied. You can only access your own resources.' 
    });
  } catch (error) {
    console.error('Ownership verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check for user or admin role (for reports access)
export const requireUserOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userType = (req as any).userType;
    
    if (!userType || (userType !== 'user' && userType !== 'Administrator')) {
      return res.status(403).json({ message: 'Access denied. User or admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 
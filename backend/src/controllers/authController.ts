import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { Op } from 'sequelize';

// Custom type for express handlers that may return responses
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Token expiration times - set to null for no expiration
const ACCESS_TOKEN_EXPIRY = null; // No expiration
const REFRESH_TOKEN_EXPIRY = null; // No expiration

// Generate JWT tokens
const generateTokens = (userId: number, username: string, userType: string) => {
  // Access token - no expiration
  const accessToken = jwt.sign(
    { userId, username, userType },
    JWT_SECRET
    // No expiresIn option for permanent tokens
  );
  
  // Refresh token - no expiration
  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET
    // No expiresIn option for permanent tokens
  );
  
  return { accessToken, refreshToken };
};

// Login handler
export const login: AsyncHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Find user by username
    const user = await User.findOne({ where: { username } });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive or suspended' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password || '');
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.user_id, 
      user.username || '', 
      user.user_type || 'user'
    );
    
    // Update user with refresh token and login info
    await user.update({
      login_token: refreshToken,
      last_login: new Date(),
      login_ip: req.ip
    });
    
    // Send response
    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        firstName: user.fname,
        lastName: user.lname,
        userType: user.user_type,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

// Register handler
export const register: AsyncHandler = async (req, res) => {
  try {
    const { 
      username, 
      password, 
      fname, 
      mname, 
      lname, 
      contact_no, 
      user_type = 'user',
      status = 'active'
    } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      fname,
      mname,
      lname,
      contact_no,
      user_type,
      status,
      login_ip: req.ip
    });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      newUser.user_id, 
      newUser.username || '', 
      newUser.user_type || 'user'
    );
    
    // Update user with refresh token
    await newUser.update({ login_token: refreshToken });
    
    // Send response
    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: newUser.user_id,
        username: newUser.username,
        firstName: newUser.fname,
        lastName: newUser.lname,
        userType: newUser.user_type,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
};

// Refresh token handler
export const refreshToken: AsyncHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Validate refresh token presence
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: number };
      
      // Find user with matching refresh token
      const user = await User.findOne({ 
        where: { 
          user_id: decoded.userId,
          login_token: refreshToken
        } 
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      // Generate new tokens
      const newTokens = generateTokens(
        user.user_id, 
        user.username || '', 
        user.user_type || 'user'
      );
      
      // Update user with new refresh token
      await user.update({ login_token: newTokens.refreshToken });
      
      // Send response
      res.status(200).json({ 
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken 
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing access token' });
  }
};

// Get current user handler
export const getCurrentUser: AsyncHandler = async (req, res) => {
  try {
    // User ID should be set by auth middleware
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find user by ID
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Send user data (excluding sensitive fields)
    res.status(200).json({
      id: user.user_id,
      username: user.username,
      firstName: user.fname,
      lastName: user.lname,
      contact: user.contact_no,
      userType: user.user_type,
      status: user.status,
      lastLogin: user.last_login,
      image: user.imgname
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

// Logout handler
export const logout: AsyncHandler = async (req, res) => {
  try {
    // User ID should be set by auth middleware
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find user by ID
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Clear refresh token
    await user.update({ login_token: null });
    
    // Send success response
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
}; 
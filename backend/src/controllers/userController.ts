import { Request, Response, RequestHandler } from 'express';
import { User } from '../models';
import { Op } from 'sequelize';

// Get all users
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get user by ID
export const getUserById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Create a new user
export const createUser: RequestHandler = async (req, res) => {
  try {
    const {
      username, password, fname, mname, lname, 
      contact_no, user_type, status
    } = req.body;
    
    // Basic validation
    if (!username) {
      res.status(400).json({ message: 'Username is required' });
      return;
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }
    
    // Create new user
    const newUser = await User.create({
      username,
      password, // Note: In a real app, you should hash the password
      fname,
      mname,
      lname,
      contact_no,
      user_type,
      status,
      login_ip: req.ip,
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Update a user
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username, password, fname, mname, lname, 
      contact_no, user_type, status
    } = req.body;
    
    // Find the user
    const user = await User.findByPk(id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Update user data
    await user.update({
      username,
      password,
      fname,
      mname,
      lname,
      contact_no,
      user_type,
      status,
    });
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete a user
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findByPk(id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Delete the user
    await user.destroy();
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
}; 
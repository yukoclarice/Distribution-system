import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, requireAdmin, verifyOwnership } from '../middleware/auth';

const router = Router();

// Get all users - admin only
router.get('/', authenticate, requireAdmin, getAllUsers);

// Get user by ID - user can access own data, admin can access any
router.get('/:id', authenticate, verifyOwnership, getUserById);

// Create a new user - admin only
router.post('/', authenticate, requireAdmin, createUser);

// Update a user - user can update own data, admin can update any
router.put('/:id', authenticate, verifyOwnership, updateUser);

// Delete a user - admin only
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router; 
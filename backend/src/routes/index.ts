import { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

// API routes
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);

export default router; 
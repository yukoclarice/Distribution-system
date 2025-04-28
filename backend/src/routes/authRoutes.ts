import { Router } from 'express';
import { 
  login, 
  register, 
  refreshToken, 
  getCurrentUser, 
  logout 
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router; 
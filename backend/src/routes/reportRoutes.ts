import express from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Ward leaders report routes
router.get('/ward-leaders', reportController.getWardLeadersReport);
router.get('/ward-leaders/:leaderId', reportController.getWardLeaderById);
router.put('/ward-leaders/:leaderId/print-status', reportController.updateLeaderPrintStatus);
router.get('/ward-leaders/:leaderId/households', reportController.getHouseholdHeads);

// Printing-specific routes
router.get('/printing/households', reportController.getHouseholdsForPrinting);
router.post('/printing/households/mark-printed', reportController.markHouseholdsAsPrinted);

// Ward Leader printing routes
router.get('/printing/ward-leaders', reportController.getWardLeadersForPrinting);
router.post('/printing/ward-leaders/mark-printed', reportController.markWardLeadersAsPrinted);

// Barangay Coordinator printing routes
router.get('/printing/barangay-coordinators', reportController.getBarangayCoordinatorsForPrinting);
router.post('/printing/barangay-coordinators/mark-printed', reportController.markBarangayCoordinatorsAsPrinted);

// Household routes
router.get('/households', reportController.getHouseholdsReport);
router.get('/households/:householdHeadId/members', reportController.getHouseholdMembers);

// Barangay coordinators routes
router.get('/barangay-coordinators', reportController.getBarangayCoordinators);
router.get('/barangay-coordinators/:coordinatorId/ward-leaders', reportController.getWardLeadersByCoordinator);

// Print statistics routes
router.get('/print-statistics', reportController.getPrintStatistics);
router.get('/print-statistics-by-barangay', reportController.getPrintStatisticsByBarangay);
router.get('/ward-leaders-statistics', reportController.getWardLeadersStatistics);

export default router; 
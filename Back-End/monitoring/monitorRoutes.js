import express from 'express';
import { isAuthenticatedUser } from '../controllers/authController.js';
import * as monitorController from './monitorController.js';

const router = express.Router();

router.post('/warn', isAuthenticatedUser, monitorController.logWarning);
router.post('/penalty', isAuthenticatedUser, monitorController.applyPenalty);
router.get('/warnings/:studentId/:quizId', isAuthenticatedUser, monitorController.getStudentWarnings);

export default router;
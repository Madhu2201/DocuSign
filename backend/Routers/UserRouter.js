import {   getAllUsers, login, register, requestPasswordReset, resetPassword, logout } from '../Controllers/UserController.js';
import { requireAdmin, requireAuth } from '../Middlewares/Auth.js';
import express from 'express';

const router=express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); 
router.post('/request-password',requestPasswordReset)
router.post('/resetpassword',resetPassword)
router.get('/users', requireAuth, requireAdmin, getAllUsers);
// router.put('/users/:userId/role', requireAuth, requireAdmin, assignRole);
export default router
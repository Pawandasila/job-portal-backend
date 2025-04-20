import express from 'express';
import { login, logout, refreshAccessToken, signUp, userProfile, updateUser, getDetailById } from '../controller/user.controller.js';
import { verifyAccessToken, verifyAdminAccessToken } from '../middleware/auth.middleware.js';
import { isAnyRecruiterOrAdmin, isAnyRecruiterOrAdminOrJobseeker, isAnyUser, isRecruiter } from '../middleware/role.middleware.js';
const router = express.Router();

router.post('/user/signup',signUp)
router.post('/user/login',login)
router.post('/user/logout' , verifyAccessToken , logout)

router.post('/user/refresh-token', refreshAccessToken);

router.get('/user/profile', verifyAccessToken, isAnyUser, userProfile);

router.patch('/user/update', verifyAccessToken, isAnyRecruiterOrAdminOrJobseeker,  updateUser);

router.get('/user/detail/:id' , verifyAccessToken , isRecruiter , getDetailById )

//admin
router.get('/admin/detail/:id' , verifyAdminAccessToken , isAnyRecruiterOrAdmin , getDetailById )

export default router;


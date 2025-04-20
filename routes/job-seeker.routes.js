import { Router } from "express";
import { checkCompletionStatus, createJobSeeker, getJobSeekerById, getJobSeekerByUserId, handleFileUploads, updateJobSeeker } from "../controller/job-seeker.controller.js";
import { verifyAccessToken } from "../middleware/auth.middleware.js";
import { isAnyRecruiterOrAdminOrJobseeker, isJobseeker } from "../middleware/role.middleware.js";

const router = Router();    

router.get('/job-seeker/me' , verifyAccessToken , isAnyRecruiterOrAdminOrJobseeker , getJobSeekerByUserId);
router.get('/job-seeker/:id' , verifyAccessToken , isAnyRecruiterOrAdminOrJobseeker , getJobSeekerById);
router.get('/job-seeker/check-status/:id' , verifyAccessToken , isJobseeker , checkCompletionStatus);
router.post('/job-seeker/create' , verifyAccessToken , isJobseeker , handleFileUploads , createJobSeeker);
router.patch('/job-seeker/update/:id' , verifyAccessToken , isAnyRecruiterOrAdminOrJobseeker , handleFileUploads , updateJobSeeker)

export default router;
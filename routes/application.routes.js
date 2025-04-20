import express from "express";
import { verifyAccessToken } from "../middleware/auth.middleware.js";
import {
  getAllApplications,
  getApplicationByJobId,
  getApplicationByRecuriterId,
  updateApplicationById,
  updateApplicationByJobseekerId,
} from "../controller/applications.controller.js";
import { isAnyRecruiterOrAdminOrJobseeker, isRecruiter } from "../middleware/role.middleware.js";
const router = express.Router();

router.get("/application/get/:id", verifyAccessToken, isAnyRecruiterOrAdminOrJobseeker ,getApplicationByJobId);
router.get("/application", verifyAccessToken, isRecruiter , getAllApplications);
router.get("/application/job/:id", verifyAccessToken, isRecruiter ,getApplicationByRecuriterId);

router.patch("/application/job/:id" , verifyAccessToken , updateApplicationById)

router.patch("/application/jobSeeker/:id" , verifyAccessToken , updateApplicationByJobseekerId)

export default router;

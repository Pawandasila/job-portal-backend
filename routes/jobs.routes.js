import { Router } from "express";
import { createJob, getJobById, getAllJobs, updateJob, deleteJob, getJobByCompanyId, getJobByUserId, applyForJob, getAppliedJobsByUserId, closeJob, reopenJob, getNotAppliedJobs } from "../controller/job.controller.js";
import { verifyAccessToken, verifyAdminAccessToken } from "../middleware/auth.middleware.js";
import { isAdmin, isAnyRecruiterOrAdmin, isAnyRecruiterOrAdminOrJobseeker, isJobseeker } from "../middleware/role.middleware.js";

const router = Router();

router.post("/job/create", verifyAccessToken, isAnyRecruiterOrAdmin, createJob);
router.get("/job/:id", verifyAccessToken, isAnyRecruiterOrAdminOrJobseeker, getJobById);
router.get("/jobs", verifyAccessToken , isAnyRecruiterOrAdmin,getAllJobs);
router.get("/jobs/not-applied", verifyAccessToken, getNotAppliedJobs);


router.put("/job/:id", verifyAccessToken, isAnyRecruiterOrAdminOrJobseeker , updateJob);
router.post("/job/delete/:id", verifyAccessToken, isAnyRecruiterOrAdmin, deleteJob);
router.get("/jobs/company/:id", getJobByCompanyId);
router.get("/jobs/user/:id", getJobByUserId);

router.post("/job/apply/:jobId", verifyAccessToken, isJobseeker, applyForJob );
router.get("/job/applied/user", verifyAccessToken, isAnyRecruiterOrAdminOrJobseeker, getAppliedJobsByUserId);

router.post("/job/close/:id", verifyAccessToken, isAnyRecruiterOrAdmin , closeJob);
router.post("/job/reopen/:id", verifyAccessToken, isAnyRecruiterOrAdmin, reopenJob);

//admin routes
router.get("/admin/jobs",verifyAdminAccessToken , isAdmin ,getAllJobs);
router.get("/admin/jobs/create", verifyAdminAccessToken , isAdmin ,createJob);
router.get("/admin/jobs/:id", verifyAdminAccessToken , isAdmin ,updateJob);
router.get("/admin/jobs/company/:id", verifyAdminAccessToken , isAdmin ,getJobByCompanyId);
router.get("/admin/jobs/user/:id", verifyAdminAccessToken , isAdmin ,getJobByUserId);


router.get("/admin/job/applied/user", verifyAdminAccessToken, isAnyRecruiterOrAdminOrJobseeker, getAppliedJobsByUserId);

router.post("/job/close/:id", verifyAdminAccessToken, isAnyRecruiterOrAdmin , closeJob);
router.post("/job/reopen/:id", verifyAdminAccessToken, isAnyRecruiterOrAdmin, reopenJob);


export default router;

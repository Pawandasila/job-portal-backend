import { Router } from "express";
import { createCompany, getCompanyById, getAllCompanies, updateCompany, deleteCompany, getCompanyByRecruiterId } from "../controller/companies.controller.js";
import { verifyAccessToken, verifyAdminAccessToken } from "../middleware/auth.middleware.js";
import { isAnyRecruiterOrAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.post("/company/create", verifyAccessToken, isAnyRecruiterOrAdmin, createCompany);
router.get("/company/:id", verifyAccessToken, isAnyRecruiterOrAdmin, getCompanyById);
router.get("/companies", verifyAccessToken, isAnyRecruiterOrAdmin, getAllCompanies);

router.put("/company/:id", verifyAccessToken, isAnyRecruiterOrAdmin, updateCompany);
router.post("/company/:id/delete", verifyAccessToken, isAnyRecruiterOrAdmin, deleteCompany);
router.get("/company/recruiter/:id", verifyAccessToken, isAnyRecruiterOrAdmin, getCompanyByRecruiterId);


//admin routes
router.post("/admin/company/create", verifyAdminAccessToken, isAnyRecruiterOrAdmin, createCompany);
router.get("/admin/company/:id", verifyAdminAccessToken, isAnyRecruiterOrAdmin, getCompanyById);
router.get("/admin/companies", verifyAdminAccessToken, isAnyRecruiterOrAdmin, getAllCompanies);

router.put("/admin/company/:id", verifyAdminAccessToken, isAnyRecruiterOrAdmin, updateCompany);
router.post("/admin/company/:id/delete", verifyAdminAccessToken, isAnyRecruiterOrAdmin, deleteCompany);
export default router;

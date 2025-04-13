import { UserRole } from "../enums/UserRole.enum.js";

export const checkRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized",
      });
    }

    console.log(req.user.role);
    
    if (!allowedRoles.includes(req?.user?.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Forbidden - Insufficient permissions",
      });
    }
    
    next();
  };
};

export const isJobseeker = checkRole(UserRole.JOBSEEKER);
export const isRecruiter = checkRole(UserRole.RECRUITER);

export const isAnyUser = checkRole([UserRole.JOBSEEKER, UserRole.RECRUITER]);

export const isAdmin = checkRole(UserRole.ADMIN);

export const isAnyRecruiterOrAdmin = checkRole([UserRole.RECRUITER, UserRole.ADMIN]);

export const isAnyRecruiterOrAdminOrJobseeker = checkRole([UserRole.RECRUITER, UserRole.ADMIN, UserRole.JOBSEEKER]);

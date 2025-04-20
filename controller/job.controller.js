import { HTTPSTATUS } from "../config/https.config.js";
import Job from "../model/jobs.Model.js";
import User from "../model/user.Model.js";
import mongoose from "mongoose";
import JobSeeker from "../model/job-seeker.Model.js";
import Applications from "../model/applications.Model.js";

export const createJob = async (req, res, next) => {
  try {
    const body = req.body;

    const job = await Job.create({
      ...body,
      createdBy: req.user._id,
    });

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      status: HTTPSTATUS.CREATED,
      message: "Job created successfully",
      job: job,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        status: HTTPSTATUS.BAD_REQUEST,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("companyId", "name logo _id");
    if (!job) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Job not found",
      });
    }

    // if (job && (!job.companyId || !job.companyId._id)) {
      
    //   await Job.findByIdAndDelete(req.params.id);

    //   return res.status(HTTPSTATUS.NOT_FOUND).json({
    //     success: false,
    //     status: HTTPSTATUS.NOT_FOUND,
    //     message: "Job deleted because its associated company no longer exists",
    //   });
    // }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Job found",
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      title,
      city,
      state,
      country,
      minSalary,
      maxSalary,
      status,
      companyId,
      jobType,
      skills,
    } = req.query;

    // Basic filters that apply to all queries
    const filters = { isDelete: "No" };
    
    // Add search filters
    if (title) filters.title = { $regex: title, $options: "i" };
    
    // Handle location filters
    if (city) filters["location.city"] = { $regex: city, $options: "i" };
    if (state) filters["location.state"] = { $regex: state, $options: "i" };
    if (country) filters["location.country"] = { $regex: country, $options: "i" };
    if (jobType) filters["location.jobType"] = jobType;
    
    // Handle company filter
    if (companyId) filters.companyId = companyId;
    
    // Handle salary filters
    // For min salary, we want jobs with max_salary >= minSalary
    if (minSalary) filters.max_salary = { $gte: parseInt(minSalary) };
    // For max salary, we want jobs with min_salary <= maxSalary
    if (maxSalary) filters.min_salary = { $lte: parseInt(maxSalary) };
    
    // Handle status filter
    if (status) filters.status = status;
    
    // Handle skills filter
    if (skills) {
      const skillsArray = skills.split(',');
      filters.skills = { $in: skillsArray };
    }

    console.log("Applied filters:", filters);

    // Create sort options
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    // Execute query
    const jobs = await Job.find(filters)
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("companyId", "name logo");

    // Count total matching jobs
    const totalJobs = await Job.countDocuments(filters);

    // Add hasApplied flag to each job
    let userAppliedJobIds = [];
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      if (user && user.appliedJobs) {
        userAppliedJobIds = user.appliedJobs.map(id => id.toString());
      }
    }

    const enhancedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      jobObj.hasApplied = userAppliedJobIds.includes(job._id.toString());
      return jobObj;
    });

    // Return response
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Jobs retrieved successfully",
      jobs: enhancedJobs,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalJobs / parseInt(limit)),
        totalJobs,
      },
    });
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Job not found",
      });
    }

    await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Job updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Job not found",
      });
    }

    await Job.findByIdAndUpdate(
      req.params.id,
      { isDelete: "Yes" },
      { new: true }
    );

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Job deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getJobByCompanyId = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sortOptions = { createdAt: -1 };

    const jobs = await Job.find({
      companyId: req.params.id,
      isDelete: "No",
    })
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("companyId", "name logo");

    const totalJobs = await Job.countDocuments({
      companyId: req.params.id,
      isDelete: "No",
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Jobs retrieved successfully",
      jobs,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalJobs / parseInt(limit)),
        totalJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobByUserId = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sortOptions = { createdAt: -1 };

    const jobs = await Job.find({ createdBy: req.params.id })
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("companyId", "name logo");

    const totalJobs = await Job.countDocuments({ createdBy: req.params.id });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Jobs retrieved successfully",
      jobs,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalJobs / parseInt(limit)),
        totalJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const closeJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status === "closed") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Job is already closed",
      });
    }

    job.status = "closed";
    await job.save();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Job closed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const reopenJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status === "open") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Job is already open",
      });
    }

    job.status = "open";
    await job.save();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Job reopened successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAppliedJobsByUserId = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sortOptions = { createdAt: -1 };

    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    const user = await User.findById(userId).populate({
      path: "appliedJobs",
      model: "Jobs", 
      populate: { 
        path: "companyId", 
        model: "Companies",
        select: "name logo" 
      },
    });
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const totalJobs = user.appliedJobs.length;
    const appliedJobs = user.appliedJobs
      .slice((page - 1) * limit, page * limit)
      .map((job) => ({
        ...job.toObject(),
        company: job.companyId,
      }));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Applied jobs retrieved successfully",
      jobs: appliedJobs,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Job not found",
      });
    }
    
    // Verify the requester has permission (job creator or admin)
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        status: HTTPSTATUS.FORBIDDEN,
        message: "You don't have permission to view applicants for this job",
      });
    }
    
    // Get the applicants with pagination
    const applicants = await JobSeeker.find({ _id: { $in: job.applicants_list } })
      .populate("user_id", "name email")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
      
    const totalApplicants = job.applicants_list.length;
    
    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Job applicants retrieved successfully",
      applicants,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalApplicants / parseInt(limit)),
        totalApplicants,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAppliedJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query;
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "User not found",
      });
    }
    
    // Build sort object
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;
    
    // Get applied jobs with pagination
    const appliedJobs = await Job.find({
      _id: { $in: user.appliedJobs || [] },
      isDelete: "No"
    })
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("companyId", "name logo");
    
    const totalAppliedJobs = await Job.countDocuments({
      _id: { $in: user.appliedJobs || [] },
      isDelete: "No"
    });
    
    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Applied jobs retrieved successfully",
      jobs: appliedJobs,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalAppliedJobs / parseInt(limit)),
        totalAppliedJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// New controller to get jobs the user hasn't applied to
export const getNotAppliedJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      title,
      city,
      state,
      country,
      minSalary,
      maxSalary,
      status,
      companyId,
    } = req.query;

    // Check for authenticated user
    if (!req.user || !req.user._id) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        status: HTTPSTATUS.UNAUTHORIZED,
        message: "Authentication required",
      });
    }

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    // Build basic filters
    const filters = { isDelete: "No" };
    
    // If user has applied to jobs, exclude them
    if (user.appliedJobs && user.appliedJobs.length > 0) {
      filters._id = { 
        $nin: user.appliedJobs.map(id => new mongoose.Types.ObjectId(id.toString())) 
      };
    }
    
    // Add search filters
    if (title) filters.title = { $regex: title, $options: "i" };
    if (city) filters["location.city"] = { $regex: city, $options: "i" };
    if (state) filters["location.state"] = { $regex: state, $options: "i" };
    if (country) filters["location.country"] = { $regex: country, $options: "i" };
    if (companyId) filters.companyId = companyId;
    if (minSalary) filters.max_salary = { $gte: parseInt(minSalary) };
    if (maxSalary) filters.min_salary = { $lte: parseInt(maxSalary) };
    if (status) filters.status = status;

    // Create sort options
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    // Execute query
    const jobs = await Job.find(filters)
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("companyId", "name logo");

    // Count total matching jobs
    const totalJobs = await Job.countDocuments(filters);

    // All jobs should have hasApplied = false
    const enhancedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      jobObj.hasApplied = false; // All jobs should be not-applied
      return jobObj;
    });

    // Return response
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Not applied jobs retrieved successfully",
      jobs: enhancedJobs,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalJobs / parseInt(limit)),
        totalJobs,
      },
    });
  } catch (error) {
    console.error("Error retrieving not applied jobs:", error);
    next(error);
  }
};

export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { _id } = req.user;
    const jobSeekerId = _id;

    // Validate jobId and jobSeekerId format
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Fetch job and job seeker
    const job = await Job.findById(jobId);
    const userId = await User.findById(_id);
    const jobSeeker = await JobSeeker.findOne({ user_id: jobSeekerId });
    console.log(job?.createdBy)

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!jobSeeker) {
      return res.status(404).json({ message: "Job-seeker not found" });
    }

    // Check if job is open
    if (job.status === "closed") {
      return res.status(400).json({ message: "Job applications are closed" });
    }

    // Check if job seeker has already applied
    const existingApplication = await Applications.findOne({
      jobId,
      userId: jobSeekerId,
      jobseekerId: jobSeeker._id,
      recuriterid : job?.createdBy
    });
    
    if (existingApplication) {
      return res.status(409).json({ message: "You have already applied for this job" });
    }

    // Check if job seeker's profile is complete enough to apply
    const profileStatus = checkProfileCompletionStatus(jobSeeker);
    if (profileStatus.essentialCompletionPercentage < 80) {
      return res.status(400).json({
        message: "Your profile is not complete enough to apply for jobs",
        profileStatus,
        requiredFields: profileStatus.missingEssentialFields,
      });
    }
    const application = new Applications({
      userId: jobSeekerId,
      jobId,
      jobseekerId: jobSeeker._id,
      applicationDate: new Date(),
      recuriterid : job?.createdBy,
      status: "submitted",
    });
    
    await application.save();

    // Update job's applicants count and list
    job.applicants += 1;
    job.applicants_list.push(jobSeekerId);
    await job.save();

    // Update job seeker: add job to applied_jobs
    if (!jobSeeker.applied_jobs) {
      jobSeeker.applied_jobs = [];
    }
    jobSeeker.applied_jobs.push(jobId);
    await jobSeeker.save();

    // Also update the User's appliedJobs array if a user ID is associated
    if (jobSeeker.user_id) {
      const user = await User.findById(jobSeeker.user_id);
      if (user) {
        if (!user.appliedJobs) {
          user.appliedJobs = [];
        }
        user.appliedJobs.push(jobId);
        await user.save();
      }
    }

    res.status(201).json({
      message: "Successfully applied to the job",
      application,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: "Error applying for the job",
      error: error.message,
    });
  }
};

const checkProfileCompletionStatus = (jobSeeker) => {
  const essentialFields = [
    "resume", 
    "photo", 
    "skills", 
    "years_of_experience", 
    "job_type"
  ];
  
  const enhancementFields = [
    "location", 
    "preferred_locations", 
    "expected_salary", 
    "availability_status",
    "work_experience",
    "education",
    "certifications",
    "languages",
    "gender",
    "dob"
  ];
  
  const completedEssentialFields = essentialFields.filter(field => {
    if (field === "skills") {
      return jobSeeker[field] && jobSeeker[field].length > 0;
    }
    return jobSeeker[field] !== undefined && jobSeeker[field] !== null && jobSeeker[field] !== "";
  });
  
  const completedEnhancementFields = enhancementFields.filter(field => {
    if (field === "preferred_locations" || field === "work_experience" || field === "education" || 
        field === "certifications" || field === "languages") {
      return jobSeeker[field] && jobSeeker[field].length > 0;
    } else if (field === "location") {
      return jobSeeker[field] && (
        jobSeeker[field].city !== "Not specified" || 
        jobSeeker[field].state !== "Not specified" || 
        jobSeeker[field].country !== "Not specified"
      );
    } else if (field === "expected_salary") {
      return jobSeeker[field] && (
        jobSeeker[field].min !== undefined || 
        jobSeeker[field].max !== undefined
      );
    }
    return jobSeeker[field] !== undefined && jobSeeker[field] !== null && jobSeeker[field] !== "";
  });
  
  const missingEssentialFields = essentialFields.filter(field => 
    !completedEssentialFields.includes(field)
  );
  
  const missingEnhancementFields = enhancementFields.filter(field => 
    !completedEnhancementFields.includes(field)
  );
  
  const essentialCompletionPercentage = 
    (completedEssentialFields.length / essentialFields.length) * 100;
  
  const overallCompletionPercentage = 
    ((completedEssentialFields.length + completedEnhancementFields.length) / 
    (essentialFields.length + enhancementFields.length)) * 100;
  

  let profileStatus = "Incomplete";
  if (essentialCompletionPercentage === 100) {
    profileStatus = enhancementFields.length === completedEnhancementFields.length ? 
      "Complete" : "Essential Complete";
  } else if (essentialCompletionPercentage >= 60) {
    profileStatus = "Mostly Complete";
  } else if (essentialCompletionPercentage >= 20) {
    profileStatus = "Partially Complete";
  }
  
  const recommendations = [];
  
  if (missingEssentialFields.length > 0) {
    recommendations.push(`Complete these essential fields to improve your profile: ${missingEssentialFields.join(', ')}`);
  }
  
  if (missingEssentialFields.length === 0 && missingEnhancementFields.length > 0) {
    recommendations.push(`Enhance your profile by adding: ${missingEnhancementFields.join(', ')}`);
  }
  
  return {
    completedEssentialFields,
    completedEnhancementFields,
    missingEssentialFields,
    missingEnhancementFields,
    essentialCompletionPercentage,
    overallCompletionPercentage,
    profileStatus,
    recommendations,
    isProfileComplete: missingEssentialFields.length === 0
  };
};
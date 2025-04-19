import { HTTPSTATUS } from "../config/https.config.js";
import JobSeeker from "../model/job-seeker.Model.js";
import { z } from "zod";
import upload from "../config/multer.config.js";
import fs from "fs";
import path from "path";

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getFilePathFromUrl = (url) => {
  if (!url) return null;

  try {
    if (url.startsWith("/uploads/")) {
      return path.join(process.cwd(), url.substring(1));
    }

    const fileUrl = new URL(url);
    const filePath = fileUrl.pathname;
    if (filePath.startsWith("/uploads/")) {
      return path.join(process.cwd(), filePath.substring(1));
    }
  } catch (error) {
    console.error("Error parsing file URL:", error);
  }

  return null;
};

const locationSchema = z.object({
  city: z.string().optional().default("Not specified"),
  state: z.string().optional().default("Not specified"),
  country: z.string().optional().default("Not specified"),
});

const preferredLocationSchema = z.object({
  city: z.string(),
  state: z.string(),
  country: z.string(),
});

const expectedSalarySchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  currency: z.string().optional().default("USD"),
});

const workExperienceSchema = z.object({
  type: z.enum(["internship", "full-time", "part-time", "freelance"]),
  level: z.enum(["fresher", "experienced"]),
  company: z.string(),
  role: z.string(),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()).optional(),
  current: z.boolean().optional().default(false),
  description: z.string().optional(),
});

const educationSchema = z.object({
  level: z.enum([
    "high_school",
    "intermediate",
    "diploma",
    "bachelor",
    "master",
    "phd",
    "other",
  ]),
  institution: z.string(),
  field_of_study: z.string(),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()).optional(),
  current: z.boolean().optional().default(false),
  grade: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string(),
  issuing_organization: z.string(),
  issue_date: z.string().or(z.date()),
  expiry_date: z.string().or(z.date()).optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().optional(),
});

const createJobSeekerSchema = z.object({
  user_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid user_id format",
  }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  dob: z.string().or(z.date()).optional(),
  resume: z
    .string()
    .regex(/^\/uploads\/.*\.(pdf|docx|txt)$/i, {
      message:
        "Resume must be a relative path to pdf, docx, or txt file in /uploads",
    })
    .optional(),
  photo: z
    .string()
    .regex(/^\/uploads\/.*\.(jpg|jpeg|png|gif)$/i, {
      message: "Photo must be a relative path to an image file in /uploads",
    })
    .optional(),
  languages: z.array(z.string()).optional(),
  work_experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  skills: z.array(z.string()).optional(),
  years_of_experience: z.number().min(0).optional(),
  location: locationSchema.optional(),
  preferred_locations: z.array(preferredLocationSchema).optional(),
  expected_salary: expectedSalarySchema.optional(),
  availability_status: z
    .enum(["immediately", "within_a_month", "3_months", "not_available"])
    .optional(),
  job_type: z
    .enum(["full_time", "part_time", "contract", "internship", "freelance"])
    .optional(),
  applied_jobs: z.array(z.string()).optional(),
});

const updateJobSeekerSchema = createJobSeekerSchema.partial();

export const handleFileUploads = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);

export const createJobSeeker = async (req, res) => {
  try {
    if (req.files) {
      if (req.files.resume) {
        req.body.resume = `/uploads/${req.files.resume[0].filename}`;
      }
      if (req.files.photo) {
        req.body.photo = `/uploads/${req.files.photo[0].filename}`;
      }
    }

    const validationResult = createJobSeekerSchema.safeParse(req.body);

    if (!validationResult.success) {
      if (req.files) {
        if (req.files.resume) deleteFile(req.files.resume[0].path);
        if (req.files.photo) deleteFile(req.files.photo[0].path);
      }

      return res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.errors,
      });
    }

    const validatedData = validationResult.data;

    const jobSeeker = new JobSeeker(validatedData);
    await jobSeeker.save();

    const profileStatus = checkProfileCompletionStatus(jobSeeker);

    res.status(201).json({
      message: "Job-seeker profile created successfully",
      jobSeeker,
      profileStatus,
    });
  } catch (error) {
    if (req.files) {
      if (req.files.resume) deleteFile(req.files.resume[0].path);
      if (req.files.photo) deleteFile(req.files.photo[0].path);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A job seeker profile already exists for this user",
      });
    }
    res.status(500).json({
      message: "Error creating job-seeker",
      error: error.message,
    });
  }
};

export const updateJobSeeker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      if (req.files) {
        if (req.files.resume) deleteFile(req.files.resume[0].path);
        if (req.files.photo) deleteFile(req.files.photo[0].path);
      }
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const existingJobSeeker = await JobSeeker.findById(id);
    if (!existingJobSeeker) {
      if (req.files) {
        if (req.files.resume) deleteFile(req.files.resume[0].path);
        if (req.files.photo) deleteFile(req.files.photo[0].path);
      }
      return res.status(404).json({ message: "Job-seeker not found" });
    }

    if (req.files) {
      if (req.files.resume) {
        const oldResumePath = getFilePathFromUrl(existingJobSeeker.resume);
        if (oldResumePath) deleteFile(oldResumePath);

        req.body.resume = `/uploads/${req.files.resume[0].filename}`;
      }

      if (req.files.photo) {
        const oldPhotoPath = getFilePathFromUrl(existingJobSeeker.photo);
        if (oldPhotoPath) deleteFile(oldPhotoPath);

        req.body.photo = `/uploads/${req.files.photo[0].filename}`;
      }
    }

    const removePhoto =
      req.body.removePhoto === "true" || req.body.photo === "";
    const removeResume =
      req.body.removeResume === "true" || req.body.resume === "";

    if (removePhoto) {
      if (existingJobSeeker.photo) {
        const oldPhotoPath = getFilePathFromUrl(existingJobSeeker.photo);
        if (oldPhotoPath) deleteFile(oldPhotoPath);
      }
      req.body.photo = null;
    }

    if (removeResume) {
      if (existingJobSeeker.resume) {
        const oldResumePath = getFilePathFromUrl(existingJobSeeker.resume);
        if (oldResumePath) deleteFile(oldResumePath);
      }
      delete req.body.resume;
    }

    const validationResult = updateJobSeekerSchema.safeParse(req.body);

    if (!validationResult.success) {
      if (req.files) {
        if (req.files.resume) deleteFile(req.files.resume[0].path);
        if (req.files.photo) deleteFile(req.files.photo[0].path);
      }

      return res.status(400).json({
        message: "Validation error",
        errors: validationResult.error.errors,
      });
    }

    const validatedData = validationResult.data;

    const updatedJobSeeker = await JobSeeker.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    const profileStatus = checkProfileCompletionStatus(updatedJobSeeker);

    res.status(200).json({
      message: "Job-seeker updated successfully",
      updatedJobSeeker,
      profileStatus,
    });
  } catch (error) {
    if (req.files) {
      if (req.files.resume) deleteFile(req.files.resume[0].path);
      if (req.files.photo) deleteFile(req.files.photo[0].path);
    }
    console.log(error)

    res.status(500).json({
      message: "Error updating job-seeker",
      error: error.message,
    });
  }
};

export const deleteJobSeeker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deletedJobSeeker = await JobSeeker.findByIdAndDelete(id);

    if (!deletedJobSeeker) {
      return res.status(404).json({ message: "Job-seeker not found" });
    }

    res.status(200).json({ message: "Job-seeker deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting job-seeker",
      error: error.message,
    });
  }
};

export const getAllJobSeekers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobSeekers = await JobSeeker.find().skip(skip).limit(limit);

    const total = await JobSeeker.countDocuments();

    res.status(200).json({
      jobSeekers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching job-seekers",
      error: error.message,
    });
  }
};

export const getJobSeekerById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobSeeker = await JobSeeker.findById(id);

    if (!jobSeeker) {
      return res.status(404).json({ message: "Job-seeker not found" });
    }

    const profileStatus = checkProfileCompletionStatus(jobSeeker);

    res.status(200).json({
      jobSeeker,
      profileStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching job-seeker",
      error: error.message,
    });
  }
};

export const getJobSeekerByUserId = async (req, res) => {
  try {
    const { _id } = req.user;

    const jobSeeker = await JobSeeker.findOne({ user_id: _id }).populate(
      "user_id",
      "firstName lastName email photo phonenumber"
    );

    if (!jobSeeker) {
      return res.status(404).json({ message: "Job-seeker not found" });
    }

    const profileStatus = checkProfileCompletionStatus(jobSeeker);

    res.status(200).json({
      jobSeeker,
      profileStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching job-seeker",
      error: error.message,
    });
  }
};

export const checkProfileCompletionStatus = (jobSeeker) => {
  const essentialFields = [
    "resume",
    "photo",
    "skills",
    "years_of_experience",
    "job_type",
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
    "dob",
  ];

  const completedEssentialFields = essentialFields.filter((field) => {
    if (field === "skills") {
      return jobSeeker[field] && jobSeeker[field].length > 0;
    }
    return (
      jobSeeker[field] !== undefined &&
      jobSeeker[field] !== null &&
      jobSeeker[field] !== ""
    );
  });

  const completedEnhancementFields = enhancementFields.filter((field) => {
    if (
      field === "preferred_locations" ||
      field === "work_experience" ||
      field === "education" ||
      field === "certifications" ||
      field === "languages"
    ) {
      return jobSeeker[field] && jobSeeker[field].length > 0;
    } else if (field === "location") {
      return (
        jobSeeker[field] &&
        (jobSeeker[field].city !== "Not specified" ||
          jobSeeker[field].state !== "Not specified" ||
          jobSeeker[field].country !== "Not specified")
      );
    } else if (field === "expected_salary") {
      return (
        jobSeeker[field] &&
        (jobSeeker[field].min !== undefined ||
          jobSeeker[field].max !== undefined)
      );
    }
    return (
      jobSeeker[field] !== undefined &&
      jobSeeker[field] !== null &&
      jobSeeker[field] !== ""
    );
  });

  const missingEssentialFields = essentialFields.filter(
    (field) => !completedEssentialFields.includes(field)
  );

  const missingEnhancementFields = enhancementFields.filter(
    (field) => !completedEnhancementFields.includes(field)
  );

  const essentialCompletionPercentage =
    (completedEssentialFields.length / essentialFields.length) * 100;

  const overallCompletionPercentage =
    ((completedEssentialFields.length + completedEnhancementFields.length) /
      (essentialFields.length + enhancementFields.length)) *
    100;

  let profileStatus = "Incomplete";
  if (essentialCompletionPercentage === 100) {
    profileStatus =
      enhancementFields.length === completedEnhancementFields.length
        ? "Complete"
        : "Essential Complete";
  } else if (essentialCompletionPercentage >= 60) {
    profileStatus = "Mostly Complete";
  } else if (essentialCompletionPercentage >= 20) {
    profileStatus = "Partially Complete";
  }

  const recommendations = [];

  if (missingEssentialFields.length > 0) {
    recommendations.push(
      `Complete these essential fields to improve your profile: ${missingEssentialFields.join(
        ", "
      )}`
    );
  }

  if (
    missingEssentialFields.length === 0 &&
    missingEnhancementFields.length > 0
  ) {
    recommendations.push(
      `Enhance your profile by adding: ${missingEnhancementFields.join(", ")}`
    );
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
    isProfileComplete: missingEssentialFields.length === 0,
  };
};

export const checkCompletionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const jobSeeker = await JobSeeker.findById(id);

    if (!jobSeeker) {
      return res.status(404).json({ message: "Job-seeker not found" });
    }

    const profileStatus = checkProfileCompletionStatus(jobSeeker);

    res.status(200).json(profileStatus);
  } catch (error) {
    res.status(500).json({
      message: "Error checking completion status",
      error: error.message,
    });
  }
};

export const getIncompleteProfiles = async (req, res) => {
  try {
    const daysSinceUpdate = parseInt(req.query.daysSinceUpdate) || 3;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceUpdate);

    const incompleteProfiles = await JobSeeker.find({
      updatedAt: { $lt: cutoffDate },
      $or: [
        { resume: { $exists: false } },
        { photo: { $exists: false } },
        { skills: { $size: 0 } },
        { years_of_experience: { $exists: false } },
        { job_type: { $exists: false } },
      ],
    });

    const profilesWithStatus = incompleteProfiles.map((profile) => {
      const status = checkProfileCompletionStatus(profile);
      return {
        _id: profile._id,
        user_id: profile.user_id,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        missingEssentialFields: status.missingEssentialFields,
        essentialCompletionPercentage: status.essentialCompletionPercentage,
        recommendations: status.recommendations,
      };
    });

    res.status(200).json({
      incompleteProfiles: profilesWithStatus,
      count: profilesWithStatus.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching incomplete profiles",
      error: error.message,
    });
  }
};

import mongoose from "mongoose";

const jobseekerSchema = new mongoose.Schema({
  // User Information
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer_not_to_say"],
  },
  dob: {
    type: Date,
  },

  // Resume and Profile Picture
  resume: {
    type: String,
    validate: {
      validator: function(value) {
        return (
          !value || 
          /^https?:\/\/.*\.(pdf|docx|txt)$/i.test(value) ||
          /^\/uploads\/.*\.(pdf|docx|txt)$/i.test(value)
        );
      },
      message: "Please provide a valid resume file path",
    },
  },
  photo: {
    type: String,
    validate: {
      validator: function(value) {
        return (
          !value ||
          /^https?:\/\/.*\.(jpg|jpeg|png|gif)$/i.test(value) ||
          /^\/uploads\/.*\.(jpg|jpeg|png|gif)$/i.test(value)
        );
      },
      message: "Please provide a valid photo file path",
    },
  },

  // Qualifications and Experience
  languages: {
    type: [String],
    default: [],
  },
  
  work_experience: [
    {
      type: {
        type: String,
        enum: ["internship", "full-time", "part-time", "freelance"],
      },
      level: {
        type: String,
        enum: ["fresher", "experienced"],
      },
      company: {
        type: String,
      },
      role: {
        type: String,
      },
      start_date: {
        type: Date,
      },
      end_date: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      }
    }
  ],
  
  education: [
    {
      level: {
        type: String,
        enum: ["high_school", "intermediate", "diploma", "bachelor", "master", "phd", "other"],
      },
      institution: {
        type: String,
      },
      field_of_study: {
        type: String,
      },
      start_date: {
        type: Date,
      },
      end_date: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      grade: {
        type: String,
      }
    }
  ],
  
  certifications: [
    {
      name: {
        type: String,
      },
      issuing_organization: {
        type: String,
      },
      issue_date: {
        type: Date,
      },
      expiry_date: {
        type: Date,
      },
      credential_id: {
        type: String,
      },
      credential_url: {
        type: String,
      }
    }
  ],
  
  skills: {
    type: [String],
    default: [],
  },
  
  years_of_experience: {
    type: Number,
    min: 0,
    default: 0,
  },

  // Location Preferences
  location: {
    city: {
      type: String,
      default: "Not specified"
    },
    state: {
      type: String,
      default: "Not specified",
    },
    country: {
      type: String,
      default: "Not specified",
    },
  },
  
  preferred_locations: [
    {
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
  ],

  // Salary Expectations and Job Type
  expected_salary: {
    min: {
      type: Number,
      min: 0,
    },
    max: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    }
  },
  
  availability_status: {
    type: String,
    enum: ["immediately", "within_a_month", "3_months", "not_available"],
    default: "immediately",
  },
  
  job_type: {
    type: String,
    enum: ["full_time", "part_time",  "internship", "freelance"],
  },

  // Track applied jobs
  applied_jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Jobs"
  }]
}, { timestamps: true });

// Add indexes for better query performance
jobseekerSchema.index({ user_id: 1 });
jobseekerSchema.index({ skills: 1 });
jobseekerSchema.index({ years_of_experience: 1 });
jobseekerSchema.index({ "location.country": 1 });
jobseekerSchema.index({ job_type: 1 });
jobseekerSchema.index({ gender: 1 });
jobseekerSchema.index({ dob: 1 });
jobseekerSchema.index({ "education.level": 1 });

const JobSeeker = mongoose.model("JobSeeker", jobseekerSchema);
export default JobSeeker;
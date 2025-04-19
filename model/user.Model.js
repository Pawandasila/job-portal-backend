import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const accessSecret =
  process.env.JWT_ACCESS_SECRET || "your-access-token-secret";
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "First name must be at least 3 characters long"],
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Last name must be at least 3 characters long"],
    },


    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
    },

    role: {
      type: String,
      required: true,
      enum: ["jobseeker", "recruiter"],
    },

    phonenumber: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Phone number must be at least 10 digits long"],
    },

    appliedJobs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Job",
      index: true,
    },

    refreshToken: {
      type: String,
      optional: true,
      default: null,
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Generate an access token
userSchema.methods.generateAccessToken = function () {
  const { _id, role } = this;
  const accessToken = jwt.sign(
    {
      userId: _id,
      role,
    },
    accessSecret,
    {
      expiresIn: "1h",
    }
  );
  return accessToken;
};

// Generate a refresh token
userSchema.methods.generateRefreshToken = function () {
  const { _id, role } = this;
  const refreshToken = jwt.sign({ userId: _id, role }, refreshSecret, {
    expiresIn: "7d",
  });
  return refreshToken;
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

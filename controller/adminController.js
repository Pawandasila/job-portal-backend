import AdminModel from "../model/adminModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { HTTPSTATUS } from "../config/https.config.js";

const generateTokens = async (userId) => {
  const admin = await AdminModel.findById(userId);
  if (!admin) {
    throw new Error("Admin not found");
  }

  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();

  // Save refresh token to database
  admin.refreshToken = refreshToken;
  await admin.save();

  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "No refresh token provided",
      });
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(HTTPSTATUS.FORBIDDEN).json({
            message: "Invalid or expired refresh token",
          });
        }

        const admin = await AdminModel.findById(decoded.userId);
        if (!admin || admin.refreshToken !== refreshToken) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: "Admin not found or refresh token mismatch",
          });
        }

        const newAccessToken = admin.generateAccessToken();

        res.status(HTTPSTATUS.OK).json({ accessToken: newAccessToken });
      }
    );
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { username, password, email, role } = req.body;

    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) {
      return res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Admin already exists" });
    }

    const admin = new AdminModel({
      username,
      password,
      email,
      role,
    });

    await admin.save();
    if (!admin) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Admin can't be created",
      });
    }

    const adminResponse = {
      id: admin._id,
    };
    res.status(200).json({
      message: "Admin created successfully",
      adminResponse,
    });
  } catch (error) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: "Server crashed",
      error: error.message,
    });
  }
};

export const Adminlogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingAdmin = await AdminModel.findOne({ email });
    if (!existingAdmin) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Admin not found",
      });
    }
    if (!existingAdmin.isValidPassword(password)) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Invalid password",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(
      existingAdmin._id
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite : "strict"
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite : "strict"
    });

    const adminResponse = {
      user:{
        _id: existingAdmin._id,
        username : existingAdmin.username,
        email : existingAdmin.email,
      },
      accessToken,
      refreshToken
    };
    res.status(200).json({
      message: "Admin logged in successfully",
      adminResponse,
      
    });
    next();
  } catch (error) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: "Server crashed",
      error: error.message,
    });
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "User not found",
      });
    }
    const { username, password, email, role } = req.body;

    const admin = await AdminModel.findByIdAndUpdate(
      user._id,
      {
        username,
        password,
        email,
        role,
      },
      {
        new: true,
      }
    );
    if (!admin) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Admin not found",
      });
    }
    res.status(200).json({
      message: "Admin updated successfully",
      admin: admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server crashed",
      error: error.message,
    });
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid admin ID",
      });
    }
    const deletedAdmin = await AdminModel.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Admin not found",
      });
    }
    res.status(200).json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server crashed",
      error: error.message,
    });
  }
};

export const logoutAdmin = async (req, res, next) => {
  try {
    await AdminModel.findByIdAndUpdate(
      req.user?.userId,
      {
        $set: {
          refreshToken: null,
        },
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    res
      .status(HTTPSTATUS.OK)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ errors: error.errors });
    }
    next(error);
  }
};

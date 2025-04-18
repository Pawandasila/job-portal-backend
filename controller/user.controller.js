import User from "../model/user.Model.js";
import { z } from "zod";
import { HTTPSTATUS } from "../config/https.config.js";
import { signUpSchema, loginSchema } from "../validation/auth.validation.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Utility function to generate tokens for a user
const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const signUp = async (req, res, next) => {
  try {
    const signupValidate = signUpSchema.parse(req.body);
    const { firstName, lastName, password, role, phonenumber, email } =
      signupValidate;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "User with this email already exists",
      });
    }

    const newUser = new User({
      firstName,
      lastName,
      password,
      role,
      phonenumber,
      email,
    });

    await newUser.save();

    res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ errors: error.errors });
    }
    next(error);
  }
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

        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: "User not found or refresh token mismatch",
          });
        }

        const newAccessToken = user.generateAccessToken();

        res.status(HTTPSTATUS.OK).json({ accessToken: newAccessToken });
      }
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Check if user exists in the database
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Invalid email or password",
      });
    }

    // Check if password matches
    const isPasswordValid = await existingUser.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Invalid email or password",
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateTokens(existingUser._id);

    const loggedInUser = await User.findById(existingUser._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    const userResponse = {
      id: loggedInUser._id,
      firstName: loggedInUser.firstName,
      lastName: loggedInUser.lastName,
      email: loggedInUser.email,
      role: loggedInUser.role,
      phonenumber: loggedInUser.phonenumber,
    };

    res
      .status(HTTPSTATUS.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Login successful",
        user: userResponse,
        accessToken,
        refreshToken,
      });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ errors: error.errors });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user?.userId, {
      $set: {
        refreshToken: null,
      },
    }, { new: true });

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

export const userProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select(
      "-password -refreshToken"
    );
    console.log(user);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "User profile fetched successfully",
      user,
    });

  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phonenumber } = req.body;
    const user = await User.findByIdAndUpdate(req.user?._id, {
      firstName,
      lastName,
      email,
      phonenumber,
    }, { new: true });

    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    const updatedUser = await User.findById(req.user?._id).select(
      "-password -refreshToken"
    );

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetailById = async(req , res , next) => {
  try {
    const {id} = req.params;
    if(!id || !mongoose.Types.ObjectId.isValid(id)){
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success : false,
        message : "Invalid or missing Id"
      });
    }

    const user = await User.findById(id).select("-password -refreshToken -__v");
    if(!user){
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User details fetched successfully.",
      data: user,
    });
    
  } catch (error) {
    console.error("Error in getDetailById:", error);
    next(error);
  }
}
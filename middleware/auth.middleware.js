import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import User from "../model/user.Model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import AdminModel from "../model/adminModel.js";

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!accessToken) {
      return res
        .status(HTTPSTATUS.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET,
      async (err, decoded) => {
        if (err) {
          return res
            .status(HTTPSTATUS.UNAUTHORIZED)
            .json({ message: "Unauthorized" });
        }

        const user = await User.findById(decoded?.userId);
        if (!user) {
          return res
            .status(HTTPSTATUS.UNAUTHORIZED)
            .json({ message: "Unauthorized" });
        }

        req.user = user;
        next();
      }
    );
  } catch (error) {
    next(error);
  }
});

export const verifyAdminAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!accessToken) {
      return res
        .status(HTTPSTATUS.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET,
      async (err, decoded) => {

        
        if (err) {
          return res
          .status(HTTPSTATUS.UNAUTHORIZED)
          .json({ message: "Unauthorized" , err });
        }

        const admin = await AdminModel.findById(decoded?.userId);
        if (!admin) {
          return res
            .status(HTTPSTATUS.UNAUTHORIZED)
            .json({ message: "Unauthorized" });
        }

        req.user = admin;
        next();
      }
    );
  } catch (error) {
    next(error);
  }
});

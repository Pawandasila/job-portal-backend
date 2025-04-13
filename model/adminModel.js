import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin"],
      default:"Admin"
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

adminSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function () {
  const { _id  , role} = this;
  const accessToken = jwt.sign({ userId: _id  , role}, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "1h",
  });
  return accessToken;
};

adminSchema.methods.generateRefreshToken = function () {
  const { _id , role } = this;
  const refreshToken = jwt.sign(
    { userId: _id  , role},
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
  return refreshToken;
};

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await hashPassword(this.password);
  next();
});

const AdminModel = model("Admin", adminSchema);
export default AdminModel;

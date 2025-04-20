import mongoose from "mongoose";

const applicationsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  jobseekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobSeeker",
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Jobs",
  },
  recuriterid : {
    type : mongoose.Schema.Types.ObjectId,
    ref:"User",
  },
  applicationDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["submitted", "reject", "shortlist", "hired"],
  },
});

const Applications = mongoose.model("Applications", applicationsSchema);
export default Applications;

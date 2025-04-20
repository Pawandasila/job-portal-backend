import { HTTPSTATUS } from "../config/https.config.js";
import Applications from "../model/applications.Model.js";

export const createApplication = async (req, res, next) => {
  try {
    const application = new Applications(req.body);
    await application.save();
    res.status(HTTPSTATUS.CREATED).json(application);
  } catch (error) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({ message: error.message });
  }
};

export const getAllApplications = async (req, res, next) => {
  try {
    const applications = await Applications.find();
    res.status(HTTPSTATUS.OK).json(applications);
  } catch (error) {
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const application = await Applications.findById(req.params.id);
    if (!application) {
      return res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ message: "Application not found" });
    }
    res.status(HTTPSTATUS.OK).json(application);
  } catch (error) {
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const getApplicationByJobId = async (req, res, next) => {
  try {
    const application = await Applications.findOne({ jobId: req.params.id });
    if (!application) {
      return res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ message: "Application not found" });
    }
    res.status(HTTPSTATUS.OK).json({ success: true, data: application });
  } catch (error) {
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const getApplicationByRecuriterId = async (req, res, next) => {
  try {
    const application = await Applications.find({ recuriterid: req.params.id })
    .populate({
      path: 'jobseekerId',
      populate: {
        path: 'user_id',
        model: 'User',
      },
    })
      .populate('jobId');

    if (!application || application.length === 0) {
      return res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ message: "Application not found" });
    }

    res.status(HTTPSTATUS.OK).json({ success: true, data: application });
  } catch (error) {
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};


export const updateApplicationById = async (req, res, next) => {
  try {
    const application = await Applications.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!application) {
      return res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ message: "Application not found" });
    }
    res.status(HTTPSTATUS.OK).json(application);
  } catch (error) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({ message: error.message });
  }
};

export const updateApplicationByJobseekerId = async (req, res, next) => {
  try {
    const application = await Applications.findOneAndUpdate(
      { jobseekerId: req.params.id }, 
      req.body,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ message: "Application not found for this Job Seeker" });
    }

    res.status(HTTPSTATUS.OK).json(application);
  } catch (error) {
    res
      .status(HTTPSTATUS.BAD_REQUEST)
      .json({ message: error.message });
  }
};


export const deleteApplicationById = async (req, res, next) => {
  try {
    const application = await Applications.findByIdAndDelete(req.params.id);
    if (!application) {
      return res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ message: "Application not found" });
    }
    res
      .status(HTTPSTATUS.OK)
      .json({ message: "Application deleted successfully" });
  } catch (error) {
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

import Companies from "../model/companies.Model.js";
import { HTTPSTATUS } from "../config/https.config.js";

export const createCompany = async (req, res, next) => {
  try {
    const body = req.body;

    const company = await Companies.create(body);

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      status: HTTPSTATUS.CREATED,
      message: "Company created successfully",
      company: company,
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

export const getCompanyById = async (req, res, next) => {
  try {
    const company = await Companies.findById(req.params.id);
    if (!company) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Company not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Company found",
      company,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Companies.find();
    if (!companies) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Companies not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Companies found",
      companies,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const company = await Companies.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!company) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Company not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Company updated",
      company,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Companies.findById(req.params.id);

    if (!company) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "Company not found",
      });
    }

    await Companies.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );

    const updatedCompany = await Companies.findById(req.params.id);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Company deleted",
      updatedCompany: updatedCompany?.status,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyByRecruiterId = async (req, res, next) => {
  try {
    const company = await Companies.find({ createdBy: req.params.id });

    if (company.length === 0) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        status: HTTPSTATUS.NOT_FOUND,
        message: "No company found for this recruiter",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      status: HTTPSTATUS.OK,
      message: "Company(ies) found",
      company,
    });
  } catch (error) {
    next(error);
  }
};

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Folder where files will be saved
  },
  filename: function (req, file, cb) {
    // Extract user ID from request (could be from token, body, or params)
    const userId = req.body.user_id || req.params.id || "unknown";
    
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    
    // Include user ID in the filename for easy identification
    cb(null, `${file.fieldname}-${userId}-${uniqueSuffix}${ext}`);
  },
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "resume") {
    // Allow only PDF, DOCX, and TXT for resumes
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "text/plain"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Resume must be a PDF, DOCX, or TXT file"), false);
    }
  } else if (file.fieldname === "photo") {
    // Allow only JPG, JPEG, PNG, and GIF for photos
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Photo must be a JPG, JPEG, PNG, or GIF file"), false);
    }
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;
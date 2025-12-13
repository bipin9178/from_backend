import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads folder if it doesn't exist
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    // Stored filename: file-<timestamp>.<ext>
    cb(null, `file-${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|jpg|jpeg|png|txt|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype =
    file.mimetype === "text/plain" ||
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/") ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported"));
  }
};

const upload = multer({ storage, fileFilter });

export default upload;

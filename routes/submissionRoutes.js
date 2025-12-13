import express from "express";
import upload from "../middleware/upload.js";
import {
  createSubmission,
  getMySubmissions,
  deleteSubmission,
  getAllSubmissions,
  downloadSubmission,
  updateSubmission,
  resubmitSubmission} from "../controllers/submissionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/",authMiddleware, upload.single("file"), createSubmission);
router.get("/my-list", authMiddleware,getMySubmissions);

 router.get("/my-all-list", getAllSubmissions);

router.get("/:id/download",authMiddleware, downloadSubmission);
router.delete("/:id",authMiddleware, deleteSubmission);
router.put("/resubmit/:id", authMiddleware, resubmitSubmission);
router.put("/:id", authMiddleware, upload.single("file"), updateSubmission);

export default router;

import Submission from "../models/Submission.js";
import fs from "fs";
import path from "path"; 
import mime from "mime-types";

// Create submission
export const createSubmission = async (req, res) => {
  try {
    const { title, status } = req.body;
    if (!req.file) return res.status(400).json({ message: "File required" });

    const submission = await Submission.create({
      user: req.user._id,
      title,
      status: status || "Draft",
      fileUrl: req.file.path,
    });

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get My submissions (With Category Filter)
export const getMySubmissions = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user: req.user._id };

    if (status && status !== "All") {
      filter.status = status;
    }
    const submissions = await Submission.find(filter)

    if (!submissions.length) {
      return res.status(404).json({ message: "No submissions found" });
    }

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// controllers/submissionController.js
export const getAllSubmissions = async (req, res) => {
  try {
  const submissions = await Submission.find({ status: "Submitted" })
      .populate("user", "username ");

    res.json(submissions);
  } catch (err) {
    console.error("Error fetching all submissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Download Submissions
export const downloadSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Construct absolute path
    const absolutePath = path.resolve(submission.fileUrl); 
    console.log("File path:", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    const originalName = submission.originalName || path.basename(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeType = mime.lookup(ext) || "application/octet-stream";

    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${originalName}"`);
    } else {
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${originalName}"`);
    }

    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Only allow the owner to delete/archive
    if (submission.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (submission.status === "Archived") {
      // Permanently delete from DB
      if (fs.existsSync(submission.fileUrl)) fs.unlinkSync(submission.fileUrl);
      await submission.deleteOne();
      return res.json({ message: "Submission permanently deleted", id: req.params.id });
    }

    // Soft delete: update status to Archived
    submission.status = "Archived";
    await submission.save();
    res.json({ message: "Submission Archived", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Update submission (title, status, file)
export const updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    submission.title = req.body.title || submission.title;
    submission.status = req.body.status || submission.status;

    if (req.file) {
      if (fs.existsSync(submission.fileUrl)) fs.unlinkSync(submission.fileUrl);
      submission.fileUrl = req.file.path;
      submission.originalName = req.file.originalname;
    }

    submission.submissionDate = new Date(); 

    const updated = await submission.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

//resubmit Submission
export const resubmitSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findOne({
      _id: id,
      user: req.user._id,
      status: "Draft",
    });

    if (!submission) {
      return res.status(404).json({ message: "Draft submission not found" });
    }

    submission.status = "Submitted";
    submission.submittedAt = new Date();

    await submission.save();

    res.status(200).json({
      message: "Resubmitted Successfully",
      submission,  // return clean object
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

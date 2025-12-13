import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  submissionDate: { type: Date, default: Date.now },
  status: { type: String, default: "Draft" }, // Draft, Submitted, Archived
  fileUrl: { type: String, required: true },
});

export default mongoose.model("Submission", submissionSchema);

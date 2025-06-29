import mongoose from "mongoose";
const EnvlopeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "completed", "declined", "voided"],
    default: "draft",
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document"
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  metadata: { type: Object }
}, { timestamps: true }); 

const Envelope = mongoose.model("Envelope", EnvlopeSchema);  
export default Envelope;
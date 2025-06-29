import mongoose from 'mongoose';

const signatureFieldSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  type: {
    type: String,
    enum: ['signature', 'date', 'text'],
    required: true
  },
  role: {
    type: String,
    enum: ['sender', 'signer'],
    required: true
  },
  page: {
    type: Number,
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  value: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SignatureField', signatureFieldSchema); 
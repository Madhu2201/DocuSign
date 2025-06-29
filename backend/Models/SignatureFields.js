import mongoose from 'mongoose';

const SignatureFieldSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipient',
    required: true
  },
  page: {
    type: Number,
    required: true,
    min: 1
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
    default: 150
  },
  height: {
    type: Number,
    default: 50
  },
  required: {
    type: Boolean,
    default: true
  },
  label: {
    type: String,
    default: 'Signature'
  },
  completed: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date
  },
  value: {
    type: String
  }
}, { timestamps: true });

const SignatureField = mongoose.model('SignatureField', SignatureFieldSchema);
export default SignatureField; 

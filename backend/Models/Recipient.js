import mongoose from 'mongoose';

const RecipientSchema = new mongoose.Schema({
  envelopeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Envelope', 
    required: true 
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['signer', 'reviewer', 'approver', 'cc'],
    default: 'signer'
  },
  signedFilePath: String,
  url: String,
  order: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'viewed', 'signed', 'declined'],
    default: 'pending'
  },
  signedAt: { type: Date },
  viewedAt: { type: Date },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  } // if recipient is a registered user
});

const Recipient = mongoose.model('Recipient', RecipientSchema);
export default Recipient;
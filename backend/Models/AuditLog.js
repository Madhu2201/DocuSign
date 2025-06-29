 import mongoose from 'mongoose';
 const AuditLogSchema = new mongoose.Schema({
  envelopeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Envelope', 
    required: true 
  },
  action: { 
    type: String, 
  enum: ['created', 'update', 'deleted', 'recipients_added','signature_embedded','Signed and uploaded document','document_uploaded', 'fields_added','prepared', 'sent', 'viewed', 'uploaded','field_signed', 'signed',"document_signed", 'completed','document_updated','reverted_to_draft',  'envelope_sent', 'sign', 'prepare'  ], required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // who performed the action
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recipient' 
  }, // if action was by a recipient
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  details: { type: Object }
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
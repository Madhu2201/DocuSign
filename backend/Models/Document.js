// import mongoose from "mongoose";

// const DocumentSchema = new mongoose.Schema({
//   envelopeId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Envelope',
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   fileName: String,
//   signedFiles: [
//   {
//     recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient' },
//     filePath: String,
//     signedAt: Date
//   }
// ],
// signedFilePath: String, 

//   size: Number,
//   filePath: String,
//   preparedFilePath: String,
//   uploadedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   pages: Number,
//   status: {
//     type: String,
//     enum: ['pending', 'prepared', 'signed','completed'],
//     default: 'pending'
//   },
//   fields: [{
//     type: {
//       type: String,
//       enum: ['signature', 'date', 'text'],
//       required: true
//     },
//     page: {
//       type: Number,
//       required: true
//     },
//     x: {
//       type: Number,
//       required: true
//     },
//     y: {
//       type: Number,
//       required: true
//     },
//     width: {
//       type: Number,
//       required: true
//     },
//     height: {
//       type: Number,
//       required: true
//     },
//     recipientName: String,
//     recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient' },
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });


// const Document=mongoose.model("Document",DocumentSchema);   
// export default Document;



import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  envelopeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Envelope',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fileName: String,

  signedFiles: [
    {
      recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient' },
      filePath: String,
      signedAt: Date,
      // Optional if storing file data
      // fileData: Buffer
    }
  ],

  size: Number,
  filePath: String,
  preparedFilePath: String,

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  pages: Number,

  status: {
    type: String,
    enum: ['pending', 'prepared', 'signed', 'completed'],
    default: 'pending'
  },

  fields: [{
    type: {
      type: String,
      enum: ['signature', 'date', 'text'],
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
    recipientName: String,
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient' }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Document = mongoose.model("Document", DocumentSchema);
export default Document;

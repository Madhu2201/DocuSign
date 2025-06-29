import mongoose from 'mongoose';
import Envelope from "../Models/Envelop.js";
import Document from "../Models/Document.js";
import Recipient from "../Models/Recipient.js";
// import SignatureField from '../Models/SignatureFields.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import SignatureField from '../Models/SignatureField.js';
// import SignatureField from "../Models/SignatureFields.js";
import AuditLog from "../Models/AuditLog.js";
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// New endpoint to get envelope by ID
export const getEnvelope = async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    // Get the envelope
    const envelope = await Envelope.findById(envelopeId);
    
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    // Check if user has permission to access this envelope
    if (envelope.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this envelope' });
    }

    // Get related documents
    const documents = await Document.find({ envelopeId: envelope._id });

    // Get related recipients
    const recipients = await Recipient.find({ envelopeId: envelope._id }).sort('order');

    // Combine the data
    const envelopeData = {
      ...envelope.toObject(),
      documents,
      recipients
    };

    res.status(200).json({ envelope: envelopeData });
  } catch (error) {
    console.error('Error getting envelope:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createEnvelope = async (req, res) => {
  try {
    const { title } = req.body;
    const senderId = req.user._id;

    const envelope = await Envelope.create({
      title,
      sender: senderId,
      status: 'draft'
    });

    await AuditLog.create({
      envelopeId: envelope._id,
      action: 'created',
      userId: senderId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'Envelope created successfully',
      envelope
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const envelope = await Envelope.findById(req.body.envelopeId);

    if (!envelope) {
      return res.status(400).json({ message: 'No envelope found for the user' });
    }

    const newDocument = await Document.create({
      envelopeId: envelope._id,
      envelopeTitle: envelope.title,
      name: req.file.originalname,
      size: req.file.size,
      fileUrl: `http://localhost:8000/uploads/${req.file.filename}`,
      url: `/uploads/${req.file.filename}`, 
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.filename,
      uploadedBy: req.user._id,
      status: 'pending',
      pages: 1
    });

    res.status(201).json({
      message: 'Upload successful',
      envelope: {
        id: envelope._id,
        title: envelope.title
      },
      document: newDocument
    });

    console.log('File received:', req.file);
    console.log('Envelope:', envelope._id, envelope.title);
  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ message: 'Server error during document upload.' });
  }
};

// export const signExistingDocument = async (req, res) => {
//  try {
//     const { documentId } = req.params;
//     const { signature, x, y, pageNumber = 1, width = 120, height = 50 } = req.body;

//     const document = await Document.findById(documentId);
//     if (!document) {
//       return res.status(404).json({ message: 'Document not found.' });
//     }

//     // Use the existing file path to update the same PDF
//     const pdfPath = path.join('uploads', document.fileName);

//     const existingPdfBytes = fs.readFileSync(pdfPath);
//     const pdfDoc = await PDFDocument.load(existingPdfBytes);

//     const pngImageBytes = Buffer.from(signature.split(',')[1], 'base64');
//     const pngImage = await pdfDoc.embedPng(pngImageBytes);

//     const page = pdfDoc.getPage(pageNumber - 1);
//     page.drawImage(pngImage, {
//       x: Number(x),
//      y: Number(y) - 14, 
//       width: Number(width),
//       height: Number(height),
//     });

//     const updatedPdfBytes = await pdfDoc.save();
//     fs.writeFileSync(pdfPath, updatedPdfBytes); // ⬅️ Overwrite same file

//     document.status = 'signed';
//     await document.save();

//     res.status(200).json({
//       message: 'Signature embedded and document updated.',
//       document,
//     });
//   } catch (error) {
//     console.error('Error signing document:', error);
//     res.status(500).json({ message: 'Failed to sign the document.' });
//   }
// };

export const signExistingDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signature, x, y, pageNumber = 1, width = 120, height = 50 } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const pdfPath = path.join('uploads', document.fileName);
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pngImageBytes = Buffer.from(signature.split(',')[1], 'base64');
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    const page = pdfDoc.getPage(pageNumber - 1);

    // 🖊️ Draw signature
    page.drawImage(pngImage, {
      x: Number(x),
      y: Number(y)-14,
      width: Number(width),
      height: Number(height),
    });

    // 📅 Draw date below signature
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const currentDate = new Date().toLocaleDateString();

    page.drawText(`Date: ${currentDate}`, {
      x: Number(x),
      y: Number(y) - 14, // Slightly below signature
      size: 8,
      font,
      color: rgb(0, 0, 0),
    });

    const updatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, updatedPdfBytes); // Overwrite original file

    document.status = 'signed';
    await document.save();

    res.status(200).json({
      message: 'Signature and date embedded successfully.',
      document,
    });

  } catch (error) {
    console.error('Error signing document:', error);
    res.status(500).json({ message: 'Failed to sign the document.' });
  }
};



// export const prepareDocument = async (req, res) => {
//   try {
//     const { documentId } = req.params;
//     const { signature, page, x, y, width, height, fields } = req.body;

//     console.log('Received prepare document request:', {
//       documentId,
//       page,
//       coordinates: { x, y, width, height },
//       hasSignature: !!signature,
//       signatureLength: signature?.length
//     });

//     // Validate input
//     if (!documentId) {
//       return res.status(400).json({ message: 'Document ID is required' });
//     }

//     if (!page || x === undefined || y === undefined || !width || !height) {
//       return res.status(400).json({ 
//         message: 'Missing required parameters: page, x, y, width, and height are required',
//         received: { page, x, y, width, height }
//       });
//     }

//     // Validate numeric values
//     if (!Number.isFinite(page) || !Number.isFinite(x) || !Number.isFinite(y) || 
//         !Number.isFinite(width) || !Number.isFinite(height)) {
//       return res.status(400).json({ 
//         message: 'Invalid coordinate values. All position and size values must be numbers.',
//         received: { page, x, y, width, height }
//       });
//     }

//     // Validate ranges
//     if (x < 0 || y < 0 || width <= 0 || height <= 0) {
//       return res.status(400).json({ 
//         message: 'Invalid dimensions. Coordinates must be non-negative and dimensions must be positive.',
//         received: { x, y, width, height }
//       });
//     }

//     // Get the document
//     const document = await Document.findById(documentId);
//     if (!document) {
//       console.error('Document not found:', documentId);
//       return res.status(404).json({ message: 'Document not found' });
//     }

//     // Get the envelope
//     const envelope = await Envelope.findById(document.envelopeId);
//     if (!envelope) {
//       console.error('Envelope not found for document:', document.envelopeId);
//       return res.status(404).json({ message: 'Envelope not found' });
//     }

//     // Check authorization
//     if (envelope.sender.toString() !== req.user._id.toString()) {
//       console.error('Unauthorized access attempt:', {
//         userId: req.user._id,
//         envelopeSender: envelope.sender
//       });
//       return res.status(403).json({ message: 'Not authorized to modify this document' });
//     }

//     try {
//       // Load the PDF document
//       const pdfPath = path.join(process.cwd(), document.filePath.replace(/^\//, ''));
//       console.log('Loading PDF from:', pdfPath);
      
//       if (!fs.existsSync(pdfPath)) {
//         console.error('PDF file not found:', {
//           path: pdfPath,
//           documentPath: document.filePath,
//           cwd: process.cwd()
//         });
//         return res.status(404).json({ message: 'PDF file not found' });
//       }

//       const pdfBytes = fs.readFileSync(pdfPath);
//       const pdfDoc = await PDFDocument.load(pdfBytes);
//       const pages = pdfDoc.getPages();

//       // Validate page number
//       if (page < 1 || page > pages.length) {
//         return res.status(400).json({ 
//           message: 'Invalid page number',
//           received: page,
//           totalPages: pages.length
//         });
//       }

//       // If signature is provided, embed it
//       if (signature) {
//         try {
//           const targetPage = pages[page - 1];
//           console.log('Processing signature for page:', page);
          
//           if (!signature.includes('base64')) {
//             return res.status(400).json({ 
//               message: 'Invalid signature format. Base64 encoded image required.'
//             });
//           }

//           // Convert base64 signature to bytes
//           const signatureImageData = signature.split(',')[1];
//           if (!signatureImageData) {
//             return res.status(400).json({ 
//               message: 'Invalid signature data format'
//             });
//           }

//           const signatureBytes = Buffer.from(signatureImageData, 'base64');
//           if (signatureBytes.length === 0) {
//             return res.status(400).json({ 
//               message: 'Empty signature data'
//             });
//           }
          
//           // Embed the signature image
//           let signatureImage;
//           try {
//             if (signature.includes('image/png')) {
//               signatureImage = await pdfDoc.embedPng(signatureBytes);
//             } else if (signature.includes('image/jpeg') || signature.includes('image/jpg')) {
//               signatureImage = await pdfDoc.embedJpg(signatureBytes);
//             } else {
//               return res.status(400).json({ 
//                 message: 'Unsupported signature image format. Only PNG and JPEG are supported.'
//               });
//             }
//           } catch (embedError) {
//             console.error('Error embedding signature image:', embedError);
//             return res.status(500).json({ 
//               message: 'Failed to embed signature image',
//               details: embedError.message 
//             });
//           }
          
//           // Get page dimensions
//           const { width: pageWidth, height: pageHeight } = targetPage.getSize();
          
//           // Validate coordinates
//           if (typeof x !== 'number' || typeof y !== 'number') {
//             return res.status(400).json({ 
//               message: 'Invalid signature coordinates'
//             });
//           }

//           // Calculate signature position (use provided coordinates or center)
//           const signatureX = x || (pageWidth - width) / 2;
//           const signatureY = y || (pageHeight - height) / 2;
          
//           console.log('Embedding signature at:', { signatureX, signatureY, width, height });

//           // Draw the signature
//           targetPage.drawImage(signatureImage, {
//             x: signatureX,
//             y: signatureY,
//             width: width || 150,
//             height: height || 50
//           });

//           // Add "Signed by Sender" text
//           const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//           targetPage.drawText('Signed by Sender', {
//             x: signatureX,
//             y: signatureY - 20,
//             size: 8,
//             font: font,
//             color: rgb(0.4, 0.4, 0.4)
//           });
//         } catch (err) {
//           console.error('Error embedding signature:', err);
//           return res.status(500).json({ 
//             message: 'Error embedding signature',
//             details: err.message 
//           });
//         }
//       }

//       // Save the modified PDF
//       const modifiedPdfBytes = await pdfDoc.save();
//       const preparedFileName = `prepared-${document._id}.pdf`;
//       const preparedFilePath = path.join(process.cwd(), 'uploads', preparedFileName);
      
//       // Ensure uploads directory exists
//       const uploadsDir = path.join(process.cwd(), 'uploads');
//       if (!fs.existsSync(uploadsDir)) {
//         fs.mkdirSync(uploadsDir, { recursive: true });
//       }

//       fs.writeFileSync(preparedFilePath, modifiedPdfBytes);

//       // Update document with prepared file path and fields
//       document.preparedFilePath = `/uploads/${preparedFileName}`;
//       if (fields && fields.length > 0) {
//         document.fields = fields;
//       }
//       await document.save();

//       // Create audit log
//       await AuditLog.create({
//         envelopeId: document.envelopeId,
//         action: signature ? 'signature_embedded' : 'fields_added',
//         userId: req.user._id,
//         details: {
//           page,
//           timestamp: new Date()
//         }
//       });

//       res.status(200).json({
//         message: signature ? 'Signature embedded successfully' : 'Fields added successfully',
//         document: document
//       });
//     } catch (err) {
//       console.error('Error in PDF processing:', err);
//       res.status(500).json({
//         message: 'Error processing PDF',
//         details: err.message
//       });
//     }
//   } catch (err) {
//     console.error('Error in prepareDocument:', err);
//     res.status(500).json({
//       message: 'Server error during document preparation',
//       details: err.message
//     });
//   }
// };

// export const saveFields = async (req, res) => {
//   try {
//     const { documentId } = req.params;
//     const { fields } = req.body;

//     if (!fields || !Array.isArray(fields)) {
//       return res.status(400).json({ message: 'Invalid fields data' });
//     }

//     const document = await Document.findById(documentId);
//     if (!document) {
//       return res.status(404).json({ message: 'Document not found' });
//     }

//     document.fields = fields;
//     await document.save();

//     res.status(200).json({ message: 'Fields saved successfully' });
//   } catch (error) {
//     console.error('Error saving fields:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };


export const prepareDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { signerFields = [], senderFields = [] } = req.body;

    // Validate fields data
    if (!Array.isArray(signerFields) || !Array.isArray(senderFields)) {
      return res.status(400).json({ message: 'signerFields and senderFields must be arrays' });
    }

    // Get the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the envelope
    const envelope = await Envelope.findById(document.envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    // Check authorization
    if (envelope.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this document' });
    }

    console.log('Preparing document with:', {
      documentId,
      signerFields: signerFields.length,
      senderFields: senderFields.length
    });

    // Update document status
    document.status = 'prepared';
    await document.save();

    // Save all fields to database
    const allFields = [
      ...signerFields.map(field => ({
        documentId: document._id,
        type: field.type,
        role: 'signer',
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        value: null
      })),
      ...senderFields.map(field => ({
        documentId: document._id,
        type: field.type,
        role: 'sender',
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        value: field.signature || null
      }))
    ];

    if (allFields.length > 0) {
      try {
        const savedFields = await SignatureField.create(allFields);
        console.log('Saved fields:', savedFields.length);

        // Create audit log for document preparation
        await AuditLog.create({
          envelopeId: document.envelopeId,
          action: 'prepared',
          userId: req.user._id,
          details: {
            signerFields: signerFields.length,
            senderFields: senderFields.length
          }
        });
      } catch (err) {
        console.error('Error saving fields:', err);
        return res.status(500).json({
          message: 'Error saving signature fields',
          details: err.message
        });
      }
    }

    res.status(200).json({
      message: 'Document prepared successfully',
      document: {
        ...document.toObject(),
        signerFields: signerFields.length,
        senderFields: senderFields.length
      }
    });
  } catch (err) {
    console.error('Error preparing document:', err);
    res.status(500).json({
      message: 'Server error during document preparation',
      details: err.message
    });
  }
};


export const saveFields = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { fields } = req.body;

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ message: 'Invalid fields data' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.fields = fields;
    await document.save();

    res.status(200).json({ message: 'Fields saved successfully' });
  } catch (error) {
    console.error('Error saving fields:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



export const addRecipients = async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const { recipients } = req.body; 

    const envelope = await Envelope.findById(envelopeId);

    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found or access denied' });
    }

    const createdRecipients = await Recipient.insertMany(
      recipients.map(recipient => ({
        envelopeId,
        ...recipient
      }))
    );

    await AuditLog.create({
      envelopeId: envelope._id,
      action: 'recipients_added',
      userId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        count: recipients.length
      }
    });

    res.status(201).json({
      message: 'Recipients added successfully',
      recipients: createdRecipients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendEnvelope = async (req, res) => {
  try {
    const { envelopeId } = req.params;

    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    if (envelope.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft envelopes can be sent' });
    }

    if (envelope.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to send this envelope' });
    }

    const recipients = await Recipient.find({ envelopeId });
    if (recipients.length === 0) {
      return res.status(400).json({ message: 'Cannot send envelope without recipients' });
    }

    envelope.status = 'sent';
    envelope.sentAt = new Date();
    await envelope.save();

    await AuditLog.create({
      envelopeId,
      action: 'envelope_sent',
      userId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    for (const recipient of recipients) {
      const signLink = `http://localhost:4200/sign-document/${envelope._id}/${recipient._id}`; 

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: 'Please Sign the Document',
        html: `
     <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
  <p style="margin-bottom: 16px;">Dear ${recipient.name},</p>

  <p style="margin-bottom: 16px;">
    You have a document titled <strong>"${envelope.title}"</strong> awaiting your review and signature.
  </p>

  <p style="margin-bottom: 16px;">
    Please click the secure link below to access and sign the document:
  </p>

  <p style="text-align: center; margin: 30px 0;">
    <a href="${signLink}"
       style="display: inline-block; padding: 12px 24px; background-color: #0069d9; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px;">
       Review & Sign Document
    </a>
  </p>

  <p style="margin-bottom: 16px;">
    This secure link is uniquely generated for you and should not be shared.
  </p>

  <p style="margin-bottom: 16px;">
    If you weren’t expecting this request or need assistance, please contact the sender directly.
  </p>

  <p style="margin-bottom: 24px;">
    Thank you for your prompt attention to this request.
  </p>

  <p style="font-weight: bold; margin-bottom: 4px;">Best regards,</p>
  <p style="margin-top: 0;">The Document Signing Team</p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #ccc;" />

  <p style="font-size: 13px; color: #777;">
    If you have questions or require support, please contact us at <a href="mailto:support@example.com">support@example.com</a>.
  </p>
</div>

        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error(`❌ Failed to send email to ${recipient.email}:`, emailErr.message);
      }
    }

    res.json({ message: '✅ Envelope sent successfully and emails dispatched to recipients.' });

  } catch (err) {
    console.error('❌ Error in sendEnvelope:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

export const getSignDocument = async (req, res) => {
  try {
    const { envelopeId, recipientId } = req.params;

    if (!envelopeId || !recipientId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Fetch envelope
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    // Fetch recipient
    const recipient = await Recipient.findOne({
      _id: recipientId,
      envelopeId: envelopeId
    });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Fetch document
    const document = await Document.findOne({ envelopeId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Fetch fields for this recipient
    const fields = await SignatureField.find({
      documentId: document._id,
      $or: [
        { recipientId: recipientId },              // explicitly assigned to recipient
        { recipientId: { $exists: false }, role: 'signer' }  // generic signer fields
      ]
    });

    const isAlreadySigned = fields.length > 0 && fields.every(f => f.value);

    res.json({
      envelopeTitle: envelope.title,
      recipientName: recipient.name,
      documentUrl: `http://localhost:8000${document.filePath}`,
      isAlreadySigned,
      fields: fields.map(field => ({
        id: field._id,
        type: field.type,
        role: field.role,
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        value: field.value || ''
      }))
    });
  } catch (err) {
    console.error('Error getting sign document:', err);
    res.status(500).json({
      message: 'Error getting document for signing',
      details: err.message
    });
  }
};





export const signDocument = async (req, res) => {
  try {
    const { envelopeId, recipientId, fields } = req.body;

    if (!envelopeId || !recipientId || !fields) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const document = await Document.findOne({ envelopeId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    const recipients = await Recipient.find({ envelopeId }).sort('order');
    const currentRecipientIndex = recipients.findIndex(r => r._id.toString() === recipientId);

    if (currentRecipientIndex === -1) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const pdfPath = path.join('uploads', path.basename(document.preparedFilePath || document.filePath));
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    for (const field of fields) {
      const dbField = await SignatureField.findById(field.id);
      if (!dbField) continue;

      const page = pages[dbField.page - 1];

      dbField.value = field.value;
      dbField.signedAt = new Date();
      dbField.completed = true;
      await dbField.save();

      if (field.type === 'signature' && field.value) {
        const signatureImageBytes = Buffer.from(field.value.split(',')[1], 'base64');
        const signatureImageEmbed = await pdfDoc.embedPng(signatureImageBytes);

//        page.drawImage(signatureImageEmbed, {
//   x: dbField.x,
//   y: dbField.y - dbField.height, // <-- shift by height
//   width: dbField.width,
//   height: dbField.height,
// });


const imageDims = signatureImageEmbed.scaleToFit(dbField.width, dbField.height);
const centeredX = dbField.x + (dbField.width - imageDims.width) / 2;

page.drawImage(signatureImageEmbed, {
  x: centeredX,
  y: dbField.y - imageDims.height,
  width: imageDims.width,
  height: imageDims.height,
});




// console.log(`Placing image at: x=${dbField.x}, y=${dbField.y - dbField.height}, width=${dbField.width}, height=${dbField.height}`);
const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
const recipient = recipients[currentRecipientIndex];

// Draw text just below the signature
const labelText = `Signed by ${recipient.name}`;
const textWidth = font.widthOfTextAtSize(labelText, 8);

page.drawText(labelText, {
  x: centeredX+5,
  y: dbField.y - dbField.height - 0.75,
  size: 8,
  font,
  color: rgb(0.4, 0.4, 0.4),
});

     } else if (field.type === 'date' || field.type === 'text') {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Calculate font size proportional to field height
  const fontSize = dbField.height * 0.2;

  page.drawText(field.value, {
    x: dbField.x + 5, // small left padding
    y: dbField.y - dbField.height * 0.75, // adjust baseline
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}
    }

    const signedPdfBytes = await pdfDoc.save();

    const signedFileName = `signed-${document._id}-${recipientId}.pdf`;
    const signedPath = path.join('uploads', signedFileName);
    fs.writeFileSync(signedPath, signedPdfBytes);

    const signedFileUrl = `${req.protocol}://${req.get('host')}/uploads/${signedFileName}`;

    // ✅ Store individual signed copy with proper ObjectId
    document.signedFiles = document.signedFiles || [];
    document.signedFiles.push({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      filePath: signedFileUrl,
      fileData: signedPdfBytes,
      signedAt: new Date()
    });

    // ✅ Check if all fields completed
    const allSignatureFields = await SignatureField.find({ documentId: document._id });
    const completedSignatures = allSignatureFields.filter(f => f.completed).length;
    const totalSignatureFields = allSignatureFields.length;

    if (completedSignatures === totalSignatureFields) {
      document.status = 'completed';
      envelope.status = 'completed';
      await envelope.save();
    }

    await document.save();

    await AuditLog.create({
      envelopeId,
      recipientId,
      action: 'signed',
      timestamp: new Date()
    });


    // ✅ One-line debug log
    console.log(`✅ Saved signed PDF for recipient ${recipientId} at ${signedPath}`);

    res.status(200).json({
      message: 'Document signed successfully',
      documentUrl: signedFileUrl,
      isCompleted: document.status === 'completed'
    });

  } catch (err) {
    console.error('Error in signDocument:', err);
    res.status(500).json({ message: 'Error signing document: ' + err.message });
  }
};


    // ✅ Notify next recipient
    // if (currentRecipientIndex < recipients.length - 1) {
    //   const nextRecipient = recipients[currentRecipientIndex + 1];
    //   const signLink = `http://localhost:4200/sign-document/${envelope._id}/${nextRecipient._id}`;

    //   const transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //       user: process.env.EMAIL_USER,
    //       pass: process.env.EMAIL_APP_PASSWORD
    //     }
    //   });

    //   const mailOptions = {
    //     from: process.env.EMAIL_USER,
    //     to: nextRecipient.email,
    //     subject: 'Document Ready for Signature',
    //     html: `
    //       <p>Dear ${nextRecipient.name},</p>
    //       <p>A document is ready for your signature.</p>
    //       <p>Please click the link below to sign:</p>
    //       <a href="${signLink}">Sign Document</a>
    //       <p>Thank you!</p>
    //     `
    //   };

    //   try {
    //     await transporter.sendMail(mailOptions);
    //   } catch (emailErr) {
    //     console.error('Failed to send email to next recipient:', emailErr);
    //   }
    // }

// export const getSignedAudit = async (req, res) => {
//   try {
//     console.log('GET /documents/signed-urls called');

//     const signedDocuments = await Document.find({
//       status: { $in: ['signed', 'completed'] }
//     })
//       .populate('envelopeId')
//       .exec();

//     console.log('Signed documents count:', signedDocuments.length);

//     const docsWithUrls = signedDocuments.map(doc => {
//       let signedFilesWithUrls = [];

//       if (Array.isArray(doc.signedFiles) && doc.signedFiles.length > 0) {
//         signedFilesWithUrls = doc.signedFiles
//           .filter(file => file.filePath)  // Corrected here to filePath
//           .map(file => {
//             const filePath = file.filePath.startsWith('/') ? file.filePath : '/' + file.filePath;
//             return {
//               ...file.toObject ? file.toObject() : file,
//               url: `${req.protocol}://${req.get('host')}${filePath}`
//             };
//           });
//       } else if (doc.signedFilePath) {
//         const signedFilePath = doc.signedFilePath.startsWith('/')
//           ? doc.signedFilePath
//           : '/' + doc.signedFilePath;

//         signedFilesWithUrls = [{
//           recipientName: 'Unknown',
//           signedAt: doc.updatedAt || doc.createdAt,
//           url: `${req.protocol}://${req.get('host')}${signedFilePath}`
//         }];
//       } else if (doc.filePath) {
//         const filePath = doc.filePath.startsWith('/') ? doc.filePath : '/' + doc.filePath;
//         signedFilesWithUrls = [{
//           recipientName: 'Original Document',
//           signedAt: doc.createdAt,
//           url: `${req.protocol}://${req.get('host')}${filePath}`
//         }];
//       }

//       return {
//         ...doc.toObject(),
//         signedFiles: signedFilesWithUrls
//       };
//     });

//     res.status(200).json({ signedDocuments: docsWithUrls });

//   } catch (error) {
//     console.error('Error in getSignedAudit:', error.message);
//     res.status(500).json({ message: 'Internal Server Error', error: error.message });
//   }
// };


export const getCompletedDocuments = async (req, res) => {
  try {
    console.log('[GET] /documents/completed - Fetching completed documents');

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const completedDocs = await Document.find({ status: 'prepared' }) // or 'signed', based on your logic
      .populate({
        path: 'envelopeId',
        select: 'title'
      })
      .populate({
        path: 'signedFiles.recipientId',
        select: 'name email'
      })
      .lean();

    console.log(`🔍 Found ${completedDocs.length} completed documents`);

    const response = completedDocs.map(doc => {
      const signedFilesWithUrl = (doc.signedFiles || []).map(file => {
        const safeFilePath = file?.filePath ? path.basename(file.filePath) : null;
        const fullUrl = safeFilePath ? `${baseUrl}/uploads/${safeFilePath}` : null;

        if (!safeFilePath) {
          console.warn(`⚠️ Missing filePath for recipient ${file.recipientId?._id}`);
        }

        return {
          recipientId: file.recipientId?._id || file.recipientId,
          recipientName: file.recipientId?.name || 'Unknown',
          filePath: fullUrl,
          signedAt: file.signedAt
        };
      });

      console.log(`📄 Document ${doc._id} has ${signedFilesWithUrl.length} signed files`);
      signedFilesWithUrl.forEach(file =>
        console.log(`👤 Recipient: ${file.recipientName}, File URL: ${file.filePath}`)
      );

      return {
        documentId: doc._id,
        envelopeId: doc.envelopeId?._id,
        envelopeTitle: doc.envelopeId?.title || 'Untitled',
        status: doc.status,
        signedFiles: signedFilesWithUrl
      };
    });

    console.log('✅ Completed document response ready to send');
    res.status(200).json(response);
  } catch (err) {
    console.error('❌ Error fetching completed documents:', err);
    res.status(500).json({ message: 'Failed to fetch completed documents' });
  }
};



// export const getCompletedDocuments = async (req, res) => {
//   try {
//     console.log('[GET] /documents/completed - Fetching completed documents');

//     const baseUrl = `${req.protocol}://${req.get('host')}`;

//     const completedDocs = await Document.find({ status: 'signed' })
//       .populate({
//         path: 'envelopeId',
//         select: 'title'
//       })
//       .populate({
//         path: 'signedFiles.recipientId',
//         select: 'name email'
//       })
//       .lean();

//     console.log(`🔍 Found ${completedDocs.length} completed documents`);

//     const response = completedDocs.map(doc => {
//       const signedFilesWithUrl = (doc.signedFiles || []).map(file => {
//         const safeFilePath = file?.filePath ? path.basename(file.filePath) : null;
//         const fullUrl = safeFilePath ? `${baseUrl}/uploads/${safeFilePath}` : null;

//         return {
//           recipientId: file.recipientId?._id || file.recipientId,
//           recipientName: file.recipientId?.name || 'Unknown',
//           filePath: fullUrl,
//           signedAt: file.signedAt
//         };
//       });

//       return {
//         documentId: doc._id,
//         envelopeId: doc.envelopeId?._id,
//         envelopeTitle: doc.envelopeId?.title || 'Untitled',
//         status: doc.status,
//         signedFiles: signedFilesWithUrl
//       };
//     });

//     console.log('✅ Completed document response ready to send');
//     res.status(200).json(response);
//   } catch (err) {
//     console.error('❌ Error fetching completed documents:', err);
//     res.status(500).json({ message: 'Failed to fetch completed documents' });
//   }
// };

export const getDocumentFields = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the envelope
    const envelope = await Envelope.findById(document.envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    // Check authorization
    if (envelope.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }

    // Fetch signature fields
    const fields = await SignatureField.find({ documentId });

    res.status(200).json({
      message: 'Fields fetched successfully',
      fields: fields.map(field => ({
        id: field._id,
        type: field.type,
        role: field.role,
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        value: field.value
      }))
    });
  } catch (error) {
    console.error('Error fetching document fields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};







// export const signDocument = async (req, res) => {
//   try {
//     const { envelopeId, recipientId, fields } = req.body;

//     if (!envelopeId || !recipientId || !fields) {
//       return res.status(400).json({ message: 'Missing required parameters' });
//     }

//     const document = await Document.findOne({ envelopeId });
//     if (!document) {
//       return res.status(404).json({ message: 'Document not found' });
//     }

//     const envelope = await Envelope.findById(envelopeId);
//     if (!envelope) {
//       return res.status(404).json({ message: 'Envelope not found' });
//     }

//     const recipients = await Recipient.find({ envelopeId }).sort('order');
//     const currentRecipientIndex = recipients.findIndex(r => r._id.toString() === recipientId);

//     if (currentRecipientIndex === -1) {
//       return res.status(404).json({ message: 'Recipient not found' });
//     }

//     const pdfPath = path.join('uploads', path.basename(document.signedFilePath || document.preparedFilePath || document.filePath));
//     const pdfBytes = fs.readFileSync(pdfPath);
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();

//     for (const field of fields) {
//       const dbField = await SignatureField.findById(field.id);
//       if (!dbField) continue;

//       const page = pages[dbField.page - 1];

//       dbField.value = field.value;
//       dbField.signedAt = new Date();
//       dbField.completed = true;
//       await dbField.save();

//       if (field.type === 'signature' && field.value) {
//         const signatureImageBytes = Buffer.from(field.value.split(',')[1], 'base64');
//         const signatureImageEmbed = await pdfDoc.embedPng(signatureImageBytes);

//         page.drawImage(signatureImageEmbed, {
//           x: dbField.x,
//           y: dbField.y,
//           width: dbField.width,
//           height: dbField.height,
//         });

//         const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//         const recipient = recipients[currentRecipientIndex];
//         page.drawText(`Signed by ${recipient.name}`, {
//           x: dbField.x,
//           y: dbField.y - 10,
//           size: 8,
//           font,
//           color: rgb(0.4, 0.4, 0.4),
//         });

//       } else if (field.type === 'date' || field.type === 'text') {
//         const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         page.drawText(field.value, {
//           x: dbField.x + 5,
//           y: dbField.y + dbField.height / 2 - 6,
//           size: 12,
//           font,
//           color: rgb(0, 0, 0),
//         });
//       }
//     }

//     const signedPdfBytes = await pdfDoc.save();

//     const signedFileName = `signed-${document._id}-${recipientId}.pdf`;
//     const signedPath = path.join('uploads', signedFileName);
//     fs.writeFileSync(signedPath, signedPdfBytes);

//     const signedFileUrl = `${req.protocol}://${req.get('host')}/uploads/${signedFileName}`;

//     // ✅ Store PDF Buffer along with path
//     document.signedFilePath = signedFileUrl;
//     document.signedFiles = document.signedFiles || [];
//     document.signedFiles.push({
//       recipientId,
//       filePath: signedFileUrl,
//       fileData: signedPdfBytes,  // <-- Store PDF in MongoDB
//       signedAt: new Date()
//     });

//     const allSignatureFields = await SignatureField.find({ documentId: document._id });
//     const completedSignatures = allSignatureFields.filter(f => f.completed).length;
//     const totalSignatureFields = allSignatureFields.length;

//     if (completedSignatures === totalSignatureFields) {
//       document.status = 'completed';
//       envelope.status = 'completed';
//       await envelope.save();
//     }

//     await document.save();

//     await AuditLog.create({
//       envelopeId,
//       recipientId,
//       action: 'signed',
//       timestamp: new Date()
//     });

//     // Notify next recipient if any
//     if (currentRecipientIndex < recipients.length - 1) {
//       const nextRecipient = recipients[currentRecipientIndex + 1];
//       const signLink = `http://localhost:4200/sign-document/${envelope._id}/${nextRecipient._id}`;

//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_APP_PASSWORD
//         }
//       });

//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: nextRecipient.email,
//         subject: 'Document Ready for Signature',
//         html: `
//           <p>Dear ${nextRecipient.name},</p>
//           <p>A document is ready for your signature.</p>
//           <p>Please click the link below to sign:</p>
//           <a href="${signLink}">Sign Document</a>
//           <p>Thank you!</p>
//         `
//       };

//       try {
//         await transporter.sendMail(mailOptions);
//       } catch (emailErr) {
//         console.error('Failed to send email to next recipient:', emailErr);
//       }
//     }

//     res.status(200).json({
//       message: 'Document signed successfully',
//       documentUrl: signedFileUrl,
//       isCompleted: document.status === 'completed'
//     });
// console.log(`✅ Signed PDF saved at: ${signedPath} for recipient: ${recipientId}`);

//   } catch (err) {
//     console.error('Error in signDocument:', err);
//     res.status(500).json({ message: 'Error signing document: ' + err.message });
//   }
// };


// export const signDocument = async (req, res) => {
//   try {
//     const { envelopeId, recipientId, fields } = req.body;

//     if (!envelopeId || !recipientId || !fields) {
//       return res.status(400).json({ message: 'Missing required parameters' });
//     }

//     const document = await Document.findOne({ envelopeId });
//     if (!document) {
//       return res.status(404).json({ message: 'Document not found' });
//     }

//     const envelope = await Envelope.findById(envelopeId);
//     if (!envelope) {
//       return res.status(404).json({ message: 'Envelope not found' });
//     }

//     const recipients = await Recipient.find({ envelopeId }).sort('order');
//     const currentRecipientIndex = recipients.findIndex(r => r._id.toString() === recipientId);

//     if (currentRecipientIndex === -1) {
//       return res.status(404).json({ message: 'Recipient not found' });
//     }

//     // ✅ Always load a fresh copy (not previously signed)
//     const pdfPath = path.join('uploads', path.basename(document.preparedFilePath || document.filePath));
//     const pdfBytes = fs.readFileSync(pdfPath);
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();

//     for (const field of fields) {
//       const dbField = await SignatureField.findById(field.id);
//       if (!dbField) continue;

//       const page = pages[dbField.page - 1];

//       dbField.value = field.value;
//       dbField.signedAt = new Date();
//       dbField.completed = true;
//       await dbField.save();

//       if (field.type === 'signature' && field.value) {
//         const signatureImageBytes = Buffer.from(field.value.split(',')[1], 'base64');
//         const signatureImageEmbed = await pdfDoc.embedPng(signatureImageBytes);

//         page.drawImage(signatureImageEmbed, {
//           x: dbField.x,
//           y: dbField.y,
//           width: dbField.width,
//           height: dbField.height,
//         });

//         const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//         const recipient = recipients[currentRecipientIndex];
//         page.drawText(`Signed by ${recipient.name}`, {
//           x: dbField.x,
//           y: dbField.y - 10,
//           size: 8,
//           font,
//           color: rgb(0.4, 0.4, 0.4),
//         });

//       } else if (field.type === 'date' || field.type === 'text') {
//         const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         page.drawText(field.value, {
//           x: dbField.x + 5,
//           y: dbField.y + dbField.height / 2 - 6,
//           size: 12,
//           font,
//           color: rgb(0, 0, 0),
//         });
//       }
//     }

//     const signedPdfBytes = await pdfDoc.save();

//     const signedFileName = `signed-${document._id}-${recipientId}.pdf`;
//     const signedPath = path.join('uploads', signedFileName);
//     fs.writeFileSync(signedPath, signedPdfBytes);

//     const signedFileUrl = `${req.protocol}://${req.get('host')}/uploads/${signedFileName}`;

//     // ✅ Store individual signed copy in MongoDB
//     document.signedFiles = document.signedFiles || [];
//     document.signedFiles.push({
//       recipientId,
//       filePath: signedFileUrl,
//       fileData: signedPdfBytes,
//       signedAt: new Date()
//     });

//     // Only mark document/envelope completed if all fields completed
//     const allSignatureFields = await SignatureField.find({ documentId: document._id });
//     const completedSignatures = allSignatureFields.filter(f => f.completed).length;
//     const totalSignatureFields = allSignatureFields.length;

//     if (completedSignatures === totalSignatureFields) {
//       document.status = 'completed';
//       envelope.status = 'completed';
//       await envelope.save();
//     }

//     await document.save();

//     await AuditLog.create({
//       envelopeId,
//       recipientId,
//       action: 'signed',
//       timestamp: new Date()
//     });

//     // Notify next recipient
//     if (currentRecipientIndex < recipients.length - 1) {
//       const nextRecipient = recipients[currentRecipientIndex + 1];
//       const signLink = `http://localhost:4200/sign-document/${envelope._id}/${nextRecipient._id}`;

//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_APP_PASSWORD
//         }
//       });

//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: nextRecipient.email,
//         subject: 'Document Ready for Signature',
//         html: `
//           <p>Dear ${nextRecipient.name},</p>
//           <p>A document is ready for your signature.</p>
//           <p>Please click the link below to sign:</p>
//           <a href="${signLink}">Sign Document</a>
//           <p>Thank you!</p>
//         `
//       };

//       try {
//         await transporter.sendMail(mailOptions);
//       } catch (emailErr) {
//         console.error('Failed to send email to next recipient:', emailErr);
//       }
//     }

//     // ✅ One-line debug log
//     console.log(`✅ Saved signed PDF for recipient ${recipientId} at ${signedPath}`);

//     res.status(200).json({
//       message: 'Document signed successfully',
//       documentUrl: signedFileUrl,
//       isCompleted: document.status === 'completed'
//     });

//   } catch (err) {
//     console.error('Error in signDocument:', err);
//     res.status(500).json({ message: 'Error signing document: ' + err.message });
//   }
// };

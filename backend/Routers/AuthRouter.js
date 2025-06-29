import express from 'express';
import { addRecipients, createEnvelope, getEnvelope, getSignDocument, prepareDocument, saveFields, sendEnvelope, signDocument, signExistingDocument, uploadDocument, getDocumentFields, getCompletedDocuments } from '../Controllers/AuthEnvelop.js';
import { requireAuth } from '../Middlewares/Auth.js';
import multer from 'multer';
import fs from 'fs';
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Document creation and preparation routes
router.post('/create', requireAuth, createEnvelope);
router.post('/envelope/upload', requireAuth, upload.single('file'), uploadDocument);
router.post('/documents/:documentId/prepare', requireAuth, prepareDocument);
router.get('/documents/:documentId/fields', requireAuth, getDocumentFields);

// Envelope management routes
router.post('/envelope/:envelopeId/recipients', requireAuth, addRecipients);
router.get('/envelope/:envelopeId', requireAuth, getEnvelope);
router.post('/envelope/:envelopeId/send', requireAuth, sendEnvelope);
router.post('/envelope/:envelopeId/document/:documentId/fields', requireAuth, saveFields);
router.post('/documents/:documentId/sign', requireAuth, signExistingDocument)

// Signing routes
router.get('/sign/:envelopeId/:recipientId', getSignDocument);
router.post('/sign', signDocument);

// Audit routes
// router.get('/documents/signed-urls', (req, res) => {
//   console.log('GET /documents/signed-urls called');
//   getSignedAudit(req, res);
// });

router.get('/documents/completed', getCompletedDocuments);
export default router;








// router.get('/envelopes/signed-document', requireAuth,getCompletedDocument );
// router.get('/documents/completed/:id', requireAuth,getCompletedDocument );
// router.get('/envelope/:envelopeId/view', requireAu/completedth, viewEnvelope);
// router.post('/field/:fieldId/sign', requireAuth, signField);
// router.get('/envelope/:envelopeId/get', requireAuth, getEnvelope);
// router.put('/document/:documentId', requireAuth, upload.single('file'), updateDocument);
// router.post('/envelope/:envelopeId/revert', requireAuth, revertEnvelopeToDraft);
// router.post('/document/:documentId/fields', requireAuth, addSignatureFields);
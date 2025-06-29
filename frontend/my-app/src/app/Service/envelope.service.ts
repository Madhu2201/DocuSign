import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Envelope {
  _id?: string;
  title: string;
  status: 'draft' | 'sent';
  documents?: Document[];
  sender?: string;
  sentAt?: Date;
}

export interface Document {
  _id?: string;
  name: string;
  size: number;
  filePath: string;
  pages: number;
  fields: SignatureField[];
  status: string;
  preparedFilePath?: string;
}

export interface SignatureField {
  type: 'signature' | 'text' | 'date';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  recipientId?: string;
  value?: string;
}

export interface Recipient {
  name: string;
  email: string;
  role: string;
  order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnvelopeService {
  private apiUrl = 'http://localhost:8000/api/auth'; // adjust this to your API URL

  constructor(private http: HttpClient) {}

  // Create new envelope
  createEnvelope(title: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { title });
  }

  // Upload document with signature and fields
  uploadDocument(envelopeId: string, file: File, signature?: string, signaturePosition?: any, fields?: any[]): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('envelopeId', envelopeId);
    
    if (signature) {
      formData.append('signature', signature);
    }
    if (signaturePosition) {
      formData.append('signaturePosition', JSON.stringify(signaturePosition));
    }
    if (fields) {
      formData.append('fields', JSON.stringify(fields));
    }

    return this.http.post(`${this.apiUrl}/envelope/upload`, formData);
  }

  // Add recipients to envelope
  addRecipients(envelopeId: string, recipients: Recipient[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/envelope/${envelopeId}/recipients`, { recipients });
  }

  // Send envelope to recipients
  sendEnvelope(envelopeId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/envelope/${envelopeId}/send`, {});
  }

  // Get signed audit for an envelope
  getSignedAudit(envelopeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/envelopes/${envelopeId}/signed-audit`);
  }
} 
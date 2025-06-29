import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SigningStatus {
  isComplete: boolean;
  totalRecipients: number;
  signedCount: number;
  recipients: {
    id: string;
    name: string;
    email: string;
    hasSigned: boolean;
    signedAt?: Date;
  }[];
}

@Injectable({ providedIn: 'root' })
export class SigningService {
  private baseUrl = 'http://localhost:8000/api/auth'; // Change to your backend URL

  constructor(private http: HttpClient) {}

  getDocumentToSign(envelopeId: string, recipientId: string) {
    return this.http.get<any>(`${this.baseUrl}/sign/${envelopeId}/${recipientId}`);
  }

  uploadSignedDocument(envelopeId: string, recipientId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('envelopeId', envelopeId);
    formData.append('recipientId', recipientId);

    return this.http.post<any>(`${this.baseUrl}/sign-document`, formData);
  }

  // New method to submit signed fields and check completion
  submitSignedFields(envelopeId: string, recipientId: string, fields: any[]): Observable<SigningStatus> {
    return this.http.post<SigningStatus>(`${this.baseUrl}/sign`, {
      envelopeId,
      recipientId,
      fields: fields.map(field => ({
        id: field.id,
        type: field.type,
        value: field.value
      }))
    });
  }

  // Get current signing status of an envelope
  getEnvelopeStatus(envelopeId: string): Observable<SigningStatus> {
    return this.http.get<SigningStatus>(`${this.baseUrl}/envelope/${envelopeId}/status`);
  }
}

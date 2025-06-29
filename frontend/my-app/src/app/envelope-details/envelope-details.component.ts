import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SignedFile {
  recipientId: string;
  recipientName: string;
  filePath: string;
  signedAt: string;
}

interface CompletedDocument {
  documentId: string;
  envelopeId: string;
  envelopeTitle: string;
  status: string;
  signedFiles: SignedFile[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl:'./envelope-details.component.html',
  styleUrls: ['./envelope-details.component.css'],
})
export class EnvelopeDetailsComponent implements OnInit {
  completedDocuments: CompletedDocument[] = [];
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<CompletedDocument[]>('http://localhost:8000/api/auth/documents/completed')
      .subscribe({
        next: (docs) => {
          this.completedDocuments = docs;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to fetch completed documents';
          this.loading = false;
          console.error(err);
        }
      });
  }
}

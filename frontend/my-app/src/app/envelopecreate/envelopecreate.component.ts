import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AuthService } from '../Service/user.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-envelopecreate',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './envelopecreate.component.html',
  styleUrls: ['./envelopecreate.component.css'],
})
export class EnvelopecreateComponent implements OnInit {
  title = '';
  file: File | null = null;
  envelopeId = '';
  documentId = '';
  envelopeTitle = '';
  message = '';
  currentStep = 1;
fileName: string = '';

  recipients: { name: string; email: string; role: string; order: number }[] = [];
  
  @ViewChild('pdfContainer') pdfContainerRef!: ElementRef;

  constructor(
    private http: HttpClient, 
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['step']) {
        this.currentStep = parseInt(params['step']);
      }
      if (params['envelopeId']) {
        this.envelopeId = params['envelopeId'];
        // Load envelope details if we have an ID
        this.loadEnvelopeDetails();
      }
    });
  }
removeFile() {
  this.file = null;
  this.fileName = '';
}

  loadEnvelopeDetails() {
    if (!this.envelopeId) return;

    const token = this.auth.getToken();
    if (!token) {
      this.message = 'Please log in first.';
      return;
    }

    this.http.get<any>(
      `http://localhost:8000/api/auth/envelope/${this.envelopeId}`,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    ).subscribe({
      next: (res) => {
        this.envelopeTitle = res.envelope.title;
        if (res.envelope.recipients) {
          this.recipients = res.envelope.recipients;
        }
      },
      error: (err) => {
        this.message = '❌ Error loading envelope: ' + (err.error?.message || err.message);
      }
    });
  }

  // Step 1: Create Envelope
  createEnvelope() {
    const token = this.auth.getToken();
    if (!token) {
      this.message = 'Please log in first.';
      return;
    }

    this.http
      .post<any>(
        'http://localhost:8000/api/auth/create',
        { title: this.title },
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
          }),
        }
      )
      .subscribe({
        next: (res) => {
          this.envelopeId = res.envelope._id;
          this.envelopeTitle = res.envelope.title;
          this.message = `✅ Envelope Created — Title: ${this.envelopeTitle}`;
          this.currentStep = 2; // Move to document upload step
        },
        error: (err) => {
          this.message = '❌ Error creating envelope: ' + (err.error?.message || err.message);
        },
      });
  }

  // Step 2: Upload Document
  // onFileChange(event: any) {
  //   this.file = event.target.files[0];
  // }
onFileChange(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.file = file;
    this.fileName = file.name; // <-- Store file name
  }
}
  uploadDocument() {
    if (!this.file || !this.envelopeId) {
      this.message = 'Please create an envelope and select a file.';
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.message = 'Please log in first.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.file);
    formData.append('envelopeId', this.envelopeId);

    this.http
      .post<any>('http://localhost:8000/api/auth/envelope/upload', formData, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .subscribe({
        next: (res) => {
          this.documentId = res.document._id;
          this.message = `📄 Document uploaded successfully`;
          // Navigate to prepare page with both IDs
          this.router.navigate(['/senderSign', this.documentId], { 
            queryParams: { 
              envelopeId: this.envelopeId
            }
          });
        },
        error: (err) => {
          this.message = '❌ Upload failed: ' + (err.error?.message || err.message);
        },
      });
  }

  // Step 3: Recipients
  addRecipient() {
    const order = this.recipients.length + 1;
    this.recipients.push({ name: '', email: '', role: 'signer', order });
  }

  removeRecipient(index: number) {
    this.recipients.splice(index, 1);
    // Update order for remaining recipients
    this.recipients.forEach((recipient, i) => {
      recipient.order = i + 1;
    });
  }

  submitRecipients() {
    if (this.recipients.length === 0) {
      this.message = 'Please add at least one recipient.';
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.message = 'Please log in first.';
      return;
    }

    this.http.post(
      `http://localhost:8000/api/auth/envelope/${this.envelopeId}/recipients`,
      { recipients: this.recipients },
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      }
    ).subscribe({
      next: (res: any) => {
        this.message = '✅ Recipients added successfully';
        this.currentStep = 4; // Move to send envelope step
      },
      error: err => this.message = '❌ Error adding recipients: ' + (err.error?.message || err.message),
    });
  }

  // Step 4: Send Envelope
  sendEnvelope() {
    if (!this.envelopeId) {
      this.message = '❗ Please complete previous steps first.';
      return;
    }

    if (!this.recipients || this.recipients.length === 0) {
      this.message = '❗ Please add at least one recipient.';
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.message = '🔒 Please log in first.';
      return;
    }

    this.http
      .post<any>(
        `http://localhost:8000/api/auth/envelope/${this.envelopeId}/send`,
        {},
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
          }),
        }
      )
      .subscribe({
        next: (res) => {
          this.message = '✅ Envelope sent successfully!';
          this.currentStep = 5; // Complete
        },
        error: (err) => {
          this.message = '❌ Error sending envelope: ' + (err.error?.message || err.message);
        },
      });
  }
} 

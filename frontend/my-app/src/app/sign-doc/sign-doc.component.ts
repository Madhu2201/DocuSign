import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../Service/user.service';
import * as pdfjsLib from 'pdfjs-dist';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';

interface SignatureField {
  id: string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
  signatureData?: string;
  recipientId?: string;
  completed?: boolean;
  value?: string;
  type: string;
}

@Component({
  selector: 'app-sign-doc',
  standalone: true,
  imports: [CommonModule, DragDropModule],
templateUrl:'./sign-doc.component.html',
styleUrls:['./sign-doc.component.css']
})
export class SignDocComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLCanvasElement>;

  documentId: string = '';
  envelopeId: string = '';
  currentRecipientId: string = '';
  isDrawing = false;
  signatureData: string = '';
  signatureFields: SignatureField[] = [];
  currentPage = 1;
  totalPages = 1;
  private pdfDoc: any = null;
  private scale = 1.5;
  private originalViewport: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.envelopeId = params['envelopeId'];
      this.currentRecipientId = params['recipientId'];
      if (this.envelopeId && this.currentRecipientId) {
        this.loadDocument();
      }
    });
  }

  ngAfterViewInit() {
    const signatureCtx = this.signatureCanvas.nativeElement.getContext('2d');
    if (signatureCtx) {
      signatureCtx.strokeStyle = '#000000';
      signatureCtx.lineWidth = 2;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadDocument() {
    const headers = this.getHeaders();
    this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.envelope && response.envelope.documents?.length > 0) {
            this.documentId = response.envelope.documents[0]._id;
            const doc = response.envelope.documents[0];
            
            // Load the PDF and signature fields
            this.loadPDF(doc.preparedFilePath || doc.filePath);
            this.loadSignatureFields();
          }
        },
        error: (error) => {
          console.error('Error loading document:', error);
        }
      });
  }

  loadSignatureFields() {
    const headers = this.getHeaders();
    this.http.get(`http://localhost:8000/api/auth/documents/${this.documentId}/fields`, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.fields) {
            this.signatureFields = response.fields.map((field: any) => ({
              ...field,
              width: field.width || 120,
              height: field.height || 50
            }));
          }
        },
        error: (error) => {
          console.error('Error loading signature fields:', error);
        }
      });
  }

  async loadPDF(pdfPath: string) {
    try {
      const pdfUrl = `http://localhost:8000${pdfPath}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      await this.renderPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  async renderPage(pageNumber: number) {
    if (!this.pdfDoc || !this.pdfViewer) return;

    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      this.originalViewport = page.getViewport({ scale: 1.0 });
      const viewport = page.getViewport({ scale: this.scale });
      
      const canvas = this.pdfViewer.nativeElement;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      this.currentPage = pageNumber;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }

  startDrawing(event: MouseEvent) {
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(
        event.clientX - canvas.getBoundingClientRect().left,
        event.clientY - canvas.getBoundingClientRect().top
      );
    }
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing) return;
    
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(
        event.clientX - canvas.getBoundingClientRect().left,
        event.clientY - canvas.getBoundingClientRect().top
      );
      ctx.stroke();
    }
  }

  stopDrawing() {
    this.isDrawing = false;
    this.signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
  }

  clearSignature() {
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.signatureData = '';
    }
  }

  placeSignature(field: SignatureField) {
    if (!this.signatureData) {
      alert('Please draw your signature first');
      return;
    }

    // Update the signature field
    field.value = this.signatureData;
    field.completed = true;
  }

  hasRequiredSignatures(): boolean {
    // Check if all required signature fields for current recipient are completed
    return this.signatureFields
      .filter(field => field.recipientId === this.currentRecipientId)
      .every(field => field.completed);
  }

  async prevPage() {
    if (this.currentPage > 1) {
      await this.renderPage(this.currentPage - 1);
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      await this.renderPage(this.currentPage + 1);
    }
  }

  submitSignatures() {
    if (!this.hasRequiredSignatures()) {
      alert('Please complete all required signatures');
      return;
    }

    const headers = this.getHeaders();
    const completedFields = this.signatureFields
      .filter(field => field.recipientId === this.currentRecipientId && field.completed)
      .map(field => ({
        id: field.id,
        type: field.type,
        value: field.value,
        x: field.x,
        y: field.y,
        page: field.page,
        width: field.width,
        height: field.height
      }));

    this.http.post(
      `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
      {
        envelopeId: this.envelopeId,
        recipientId: this.currentRecipientId,
        fields: completedFields
      },
      { headers }
    ).subscribe({
      next: (response: any) => {
        alert('Document signed successfully!');
        // Redirect to a confirmation page or document view
        this.router.navigate(['/documents']);
      },
      error: (error) => {
        console.error('Error signing document:', error);
        alert('Failed to sign document. Please try again.');
      }
    });
  }
} 
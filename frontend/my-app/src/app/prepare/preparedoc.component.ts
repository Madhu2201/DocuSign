import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../Service/user.service';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import * as pdfjsLib from 'pdfjs-dist';

interface Field {
  type: 'signature' | 'date' | 'text';
  role: 'signer';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  embedded: boolean;
}

@Component({
  selector: 'app-prepare-document',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './preparedoc.component.html',
  styleUrls: ['./preparedoc.component.css']
})
export class PrepareDocumentComponent implements OnInit {
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;

  documentId = '';
  envelopeId = '';
  recipientId = '';
  document: any = null;
  envelope: any = null;

  message = '';
  fields: Field[] = [];
  currentPage = 1;
  totalPages = 0;
  scale = 1.5;
  pdfDoc: any = null;
resizingField: Field | null = null;
resizeStartX = 0;
resizeStartY = 0;
initialWidth = 0;
initialHeight = 0;
  selectedFieldType: { type: 'signature' | 'date' | 'text'; role: 'signer' } | null = null;

  fieldTypes = [
    { type: 'signature', role: 'signer', label: 'Add Signer Signature' },
    { type: 'date', role: 'signer', label: 'Add Date Field' },
    { type: 'text', role: 'signer', label: 'Add Text Field' }
  ];

  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  isPlacingNewField = false;

  originalViewport: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.documentId = params['id'];
      if (this.documentId) {
        this.route.queryParams.subscribe(params => {
          this.envelopeId = params['envelopeId'];
          if (this.envelopeId) {
            this.loadDocument();
          } else {
            console.error('No envelopeId provided in query params');
            this.message = '❌ No envelope ID provided';
          }
        });
      } else {
        console.error('No documentId provided in route params');
        this.message = '❌ No document ID provided';
      }
    });
  }

  loadDocument() {
    const token = this.auth.getToken();
    if (!token) {
      this.message = 'Please log in first.';
      return;
    }

    console.log('Loading document with envelopeId:', this.envelopeId);

    this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).subscribe({
      next: (res: any) => {
        this.envelope = res.envelope;
        const doc = this.envelope.documents?.find((d: any) => d._id === this.documentId);
        if (doc) {
          this.document = doc;
          this.message = '✅ Document loaded successfully';
          console.log('Document found:', doc);
          // Use the signed file path if available, otherwise use the original file path
          const pdfUrl = doc.signedFilePath || doc.preparedFilePath || doc.filePath;
          console.log('Using PDF URL:', pdfUrl);
          this.loadPDF(pdfUrl);
        } else {
          console.error('Document not found in envelope. Available documents:', this.envelope.documents);
          this.message = '❌ Document not found in envelope';
        }
      },
      error: err => {
        console.error('Error loading document:', err);
        this.message = '❌ Error loading document: ' + (err.error?.message || err.message);
      }
    });
  }

  async loadPDF(pdfUrl: string) {
    try {
      const fullUrl = `http://localhost:8000${pdfUrl}`;
      console.log('Loading PDF from:', fullUrl);
      const loadingTask = pdfjsLib.getDocument(fullUrl);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      console.log('PDF loaded successfully. Total pages:', this.totalPages);
      await this.renderPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.message = '❌ Error loading PDF';
    }
  }

  async renderPage(pageNumber: number) {
    if (!this.pdfDoc) {
      console.error('No PDF document loaded');
      return;
    }

    try {
      console.log('Rendering page:', pageNumber);
      const page = await this.pdfDoc.getPage(pageNumber);
      const canvas = this.pdfCanvas.nativeElement;
      
      // Store original viewport for coordinate calculations
      this.originalViewport = page.getViewport({ scale: 1.0 });

      // Create viewport with fixed scale
      const viewport = page.getViewport({ scale: this.scale });

      // Set canvas dimensions to match viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.currentPage = pageNumber;
      console.log('Page rendered successfully');
    } catch (error) {
      console.error('Error rendering page:', error);
      this.message = '❌ Failed to render PDF page.';
    }
  }

  // Convert screen coordinates to PDF coordinates
  screenToPdfCoordinates(x: number, y: number): { x: number, y: number } {
    const canvas = this.pdfCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Get the click position relative to the canvas
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;

    // Convert to PDF coordinates
    const pdfX = (relativeX / this.scale);
    const pdfY = this.originalViewport.height - (relativeY / this.scale);

    return { x: pdfX, y: pdfY };
  }

  // Convert PDF coordinates to screen coordinates
  pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
    if (!this.originalViewport) return { x, y };

    const canvas = this.pdfCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    // Convert from PDF coordinates to canvas coordinates
    const canvasX = x * this.scale;
    const canvasY = (this.originalViewport.height - y) * this.scale;

    // Convert to screen coordinates
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY
    };
  }

  prevPage() {
    if (this.currentPage > 1) this.renderPage(this.currentPage - 1);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.renderPage(this.currentPage + 1);
  }

  selectFieldType(type: 'signature' | 'date' | 'text', role: 'signer') {
    this.selectedFieldType = { type, role };
  }

  isClickOnField(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    return target.closest('.field-marker') !== null;
  }

  onMouseDown(event: MouseEvent) {
    if (this.isClickOnField(event)) {
      return;
    }

    if (!this.selectedFieldType) {
      return;
    }
    
    const pdfCoords = this.screenToPdfCoordinates(event.clientX, event.clientY);
    
    const newField: Field = {
      ...this.selectedFieldType,
      page: this.currentPage,
      x: pdfCoords.x,
      y: pdfCoords.y,
      width: 150,  // Default width in PDF units
      height: 50,  // Default height in PDF units
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      embedded: false
    };
    
    this.fields.push(newField);
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.isPlacingNewField) return;
    
    const currentField = this.fields[this.fields.length - 1];
    if (currentField) {
      const pdfCoords = this.screenToPdfCoordinates(event.clientX, event.clientY);
      currentField.x = pdfCoords.x;
      currentField.y = pdfCoords.y;
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.isPlacingNewField = false;
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  removeField(index: number, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (index >= 0 && index < this.fields.length) {
      this.fields.splice(index, 1);
    }
  }

  onDragEnded(event: CdkDragEnd, field: Field) {
    if (this.isPlacingNewField) return;
    
    const element = event.source.element.nativeElement;
    const transform = element.style.transform;
    const matches = transform.match(/translate3d\((-?\d+)px, (-?\d+)px, 0px\)/);

    if (matches) {
      const deltaX = parseInt(matches[1], 10);
      const deltaY = parseInt(matches[2], 10);

      // Convert the deltas to PDF coordinates
      const deltaInPdfUnits = {
        x: deltaX / this.scale,
        y: deltaY / this.scale
      };

      // Update field position
      field.x += deltaInPdfUnits.x;
      field.y -= deltaInPdfUnits.y; // Subtract because PDF coordinates are flipped

      // Reset the transform
      element.style.transform = 'none';
    }
  }
startResize(event: MouseEvent, field: Field) {
  event.stopPropagation();
  event.preventDefault();

  this.resizingField = field;
  this.resizeStartX = event.clientX;
  this.resizeStartY = event.clientY;
  this.initialWidth = field.width;
  this.initialHeight = field.height;

  document.addEventListener('mousemove', this.performResize);
  document.addEventListener('mouseup', this.stopResize);
}

performResize = (event: MouseEvent) => {
  if (!this.resizingField) return;

  const deltaX = (event.clientX - this.resizeStartX) / this.scale;
  const deltaY = (event.clientY - this.resizeStartY) / this.scale;

  this.resizingField.width = Math.max(30, this.initialWidth + deltaX);
  this.resizingField.height = Math.max(20, this.initialHeight + deltaY);
};

stopResize = () => {
  this.resizingField = null;
  document.removeEventListener('mousemove', this.performResize);
  document.removeEventListener('mouseup', this.stopResize);
};

  getFieldPosition(field: Field) {
    const screenCoords = this.pdfToScreenCoordinates(field.x, field.y);
    
    return {
      position: 'absolute',
      left: `${screenCoords.x}px`,
      top: `${screenCoords.y}px`,
      width: `${field.width * this.scale}px`,
      height: `${field.height * this.scale}px`,
      transform: 'none',
      zIndex: '1'
    };
  }

  getFieldPreview(field: Field): string {
    switch (field.type) {
      case 'signature': return 'Sign Here ✍️';
      case 'date': return 'Date: MM/DD/YYYY';
      case 'text': return 'Text Field';
      default: return '';
    }
  }

  canSave(): boolean {
    return this.fields.length > 0;
  }

  getSaveButtonText(): string {
    return this.canSave() ? 'Save Document Preparation' : 'Add at least one field';
  }
  

  savePreparation() {
    const token = this.auth.getToken();
    if (!token) {
      this.message = 'Please log in first.';
      return;
    }

    if (!this.canSave()) {
      this.message = '❌ Please add at least one field';
      return;
    }

    const signerFields = this.fields.filter(f => f.role === 'signer');

    this.http.post(
      `http://localhost:8000/api/auth/documents/${this.documentId}/prepare`,
      { signerFields },
      { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
    ).subscribe({
      next: () => {
        this.message = '✅ Document prepared successfully';
        this.router.navigate(['/create'], {
          queryParams: { step: '3', envelopeId: this.envelopeId }
        });
      },
      error: err => {
        console.error('Error saving:', err);
        this.message = '❌ Error preparing document: ' + (err.error?.message || err.message);
      }
    });
  }
}

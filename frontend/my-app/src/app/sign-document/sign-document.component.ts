// import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { SignaturePadComponent, AngularSignaturePadModule } from '@almothafar/angular-signature-pad';
// import { SafeUrlPipe } from '../safe.pipe';
// import * as pdfjsLib from 'pdfjs-dist';

// interface Field {
//   id: string;
//   type: 'signature' | 'date' | 'text';
//   role: 'signer';
//   page: number;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   value?: string;
//   signed?: boolean;
// }

// @Component({
//   selector: 'app-sign-document',
//   standalone: true,
//   imports: [CommonModule, FormsModule, SafeUrlPipe, AngularSignaturePadModule],
//   templateUrl: './sign-document.component.html',
//   styleUrls: ['./sign-document.component.css']
// })
// export class SignDocumentComponent implements OnInit {
//   @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('signaturePad') signaturePad?: SignaturePadComponent;

//   envelopeId: string = '';
//   recipientId: string = '';
//   envelopeTitle: string = '';
//   recipientName: string = '';
//   documentUrl: string = '';
//   fields: Field[] = [];

//   currentPage: number = 1;
//   totalPages: number = 0;
//   scale = 1.5;
//   pdfDoc: any = null;

//   loading: boolean = true;
//   error: string = '';
//   success: string = '';
//   activeField: Field | null = null;

//   originalViewport: any;

//   constructor(private route: ActivatedRoute, private http: HttpClient) {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//   }

//   ngOnInit() {
//     this.route.params.subscribe(params => {
//       this.envelopeId = params['envelopeId'];
//       this.recipientId = params['recipientId'];
//       if (this.envelopeId && this.recipientId) {
//         this.fetchDocument();
//       }
//     });
//   }

//   fetchDocument() {
//     this.http
//       .get<any>(`http://localhost:8000/api/auth/sign/${this.envelopeId}/${this.recipientId}`)
//       .subscribe({
//         next: (res) => {
//           this.envelopeTitle = res.envelopeTitle;
//           this.recipientName = res.recipientName;
//           this.documentUrl = res.documentUrl;
//           this.fields = res.fields.map((field: Field) => ({
//             ...field,
//             signed: false
//           }));
          
//           this.loading = false;
//           this.loadPDF();
//         },
//         error: (err) => {
//           console.error('Error fetching document:', err);
//           this.error = err.error?.message || 'Error fetching document.';
//           this.loading = false;
//         }
//       });
//   }

//   async loadPDF() {
//     try {
//       const loadingTask = pdfjsLib.getDocument(this.documentUrl);
//       this.pdfDoc = await loadingTask.promise;
//       this.totalPages = this.pdfDoc.numPages;
//       await this.renderPage(1);
//     } catch (error) {
//       console.error('Error loading PDF:', error);
//       this.error = 'Failed to load PDF document.';
//     }
//   }

//   async renderPage(pageNumber: number) {
//     try {
//       const page = await this.pdfDoc.getPage(pageNumber);
//       const canvas = this.pdfCanvas.nativeElement;
//       const viewport = page.getViewport({ scale: this.scale });

//       // Store the original viewport dimensions
//       this.originalViewport = page.getViewport({ scale: 1.0 });

//       canvas.height = viewport.height;
//       canvas.width = viewport.width;

//       // Set container dimensions
//       const container = canvas.parentElement;
//       if (container) {
//         container.style.minHeight = `${viewport.height + 40}px`; // Add padding
//         container.style.width = `${viewport.width + 40}px`; // Add padding
        
//         // Set overlay dimensions
//         const overlay = container.querySelector('.fields-overlay');
//         if (overlay instanceof HTMLElement) {
//           overlay.style.width = `${viewport.width}px`;
//           overlay.style.height = `${viewport.height}px`;
//         }
//       }

//       const renderContext = {
//         canvasContext: canvas.getContext('2d'),
//         viewport
//       };

//       await page.render(renderContext).promise;
//       this.currentPage = pageNumber;
//     } catch (error) {
//       console.error('Error rendering page:', error);
//       this.error = 'Failed to render PDF page.';
//     }
//   }



// onFieldClick(field: any) {
//   if (field.type === 'signature') {
//     this.activeField = field; // show signature modal
//   } else {
//     // For text or date fields, open inline input
//     this.activeField = field;
//   }
// }

// finishEditingField() {
//   if (this.activeField) {
//     this.activeField.signed = true; // mark as filled
//     this.activeField = null;         // close input
//   }
// }


//   async signField() {
//     if (!this.activeField || !this.signaturePad) return;

//     const field = this.activeField;
//     let value = '';

//     if (field.type === 'signature') {
//       if (this.signaturePad.isEmpty()) {
//         this.error = 'Please draw your signature first.';
//         return;
//       }
//       value = this.signaturePad.toDataURL();
//     }

//     // Mark the field as signed
//     field.value = value;
//     field.signed = true;
//     this.activeField = null;

//     // Check if all required fields are signed
//     const allFieldsSigned = this.fields.every(f => f.signed);
    
//     if (allFieldsSigned) {
//       await this.submitSignedDocument();
//     }
//   }

//   // Check if all fields are filled
//   allFieldsFilled(): boolean {
//     return this.fields.every(field => field.signed);
//   }

//   async submitSignedDocument() {
//     try {
//       const response = await this.http.post(`http://localhost:8000/api/auth/sign`, {
//         envelopeId: this.envelopeId,
//         recipientId: this.recipientId,
//         fields: this.fields.map(field => ({
//           id: field.id,
//           type: field.type,
//           value: field.value
//         }))
//       }).toPromise();

//       this.success = 'Document signed and uploaded successfully!';
//       // Reload the PDF to show embedded signatures
//       await this.loadPDF();
//     } catch (error) {
//       console.error('Error submitting signed document:', error);
//       this.error = 'Failed to submit signed document. Please try again.';
//     }
//   }

//   prevPage() {
//     if (this.currentPage > 1) {
//       this.renderPage(this.currentPage - 1);
//     }
//   }

//   nextPage() {
//     if (this.currentPage < this.totalPages) {
//       this.renderPage(this.currentPage + 1);
//     }
//   }

//   // Convert PDF coordinates to screen coordinates
//   pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
//     if (!this.originalViewport) return { x, y };

//     // Convert from PDF coordinates to canvas coordinates
//     const canvasX = x * this.scale;
//     const canvasY = (this.originalViewport.height - y) * this.scale;

//     return {
//       x: canvasX,
//       y: canvasY
//     };
//   }

//   // Update the field position calculation
//   getFieldPosition(field: Field): any {
//     const screenCoords = this.pdfToScreenCoordinates(field.x, field.y);
//     return {
//       position: 'absolute',
//       left: `${screenCoords.x}px`,
//       top: `${screenCoords.y}px`,
//       width: `${field.width * this.scale}px`,
//       height: `${field.height * this.scale}px`,
//       transform: 'none'
//     };
//   }
// }

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SignaturePadComponent, AngularSignaturePadModule } from '@almothafar/angular-signature-pad';
import { SafeUrlPipe } from '../safe.pipe';
import * as pdfjsLib from 'pdfjs-dist';

interface Field {
  id: string;
  type: 'signature' | 'date' | 'text';
  role: 'signer';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  signed?: boolean;
}

@Component({
  selector: 'app-sign-document',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe, AngularSignaturePadModule],
  templateUrl: './sign-document.component.html',
  styleUrls: ['./sign-document.component.css']
})
export class SignDocumentComponent implements OnInit {
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('signaturePad') signaturePad?: SignaturePadComponent;

  envelopeId: string = '';
  recipientId: string = '';
  envelopeTitle: string = '';
  recipientName: string = '';
  documentUrl: string = '';
  fields: Field[] = [];

  currentPage: number = 1;
  totalPages: number = 0;
  scale = 1.5;
  pdfDoc: any = null;

  loading: boolean = true;
  error: string = '';
  success: string = '';
  activeField: Field | null = null;

  originalViewport: any;

  // Signature options
  signatureMode: 'draw' | 'type' | null = 'draw';
  typedName: string = '';
  selectedFont: string = 'Cursive';
fonts = ['Pacifico', 'Dancing Script', 'Caveat', 'Great Vibes', 'Satisfy'];

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.envelopeId = params['envelopeId'];
      this.recipientId = params['recipientId'];
      if (this.envelopeId && this.recipientId) {
        this.fetchDocument();
      }
    });
  }

  fetchDocument() {
    this.http
      .get<any>(`http://localhost:8000/api/auth/sign/${this.envelopeId}/${this.recipientId}`)
      .subscribe({
        next: (res) => {
          this.envelopeTitle = res.envelopeTitle;
          this.recipientName = res.recipientName;
          this.documentUrl = res.documentUrl;
          console.log('📦 Raw fetched fields:', res.fields);
         this.fields = res.fields.map((field: Field) => {
  const screenCoords = this.pdfToScreenCoordinates(field.x, field.y);
  console.log(`🔁 Field ${field.id} - PDF x:${field.x}, y:${field.y} -> screen x:${screenCoords.x}, y:${screenCoords.y}`);
  return {
    ...field,
    signed: false
  };
});
          
          this.loading = false;
          this.loadPDF();
        },
        error: (err) => {
          console.error('Error fetching document:', err);
          this.error = err.error?.message || 'Error fetching document.';
          this.loading = false;
        }
      });
  }

  async loadPDF() {
    try {
      const loadingTask = pdfjsLib.getDocument(this.documentUrl);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      await this.renderPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.error = 'Failed to load PDF document.';
    }
  }

  async renderPage(pageNumber: number) {
    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const canvas = this.pdfCanvas.nativeElement;
      const viewport = page.getViewport({ scale: this.scale });

      this.originalViewport = page.getViewport({ scale: 1.0 });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const container = canvas.parentElement;
      if (container) {
        container.style.minHeight = `${viewport.height + 40}px`;
        container.style.width = `${viewport.width + 40}px`;
        
        const overlay = container.querySelector('.fields-overlay');
        if (overlay instanceof HTMLElement) {
          overlay.style.width = `${viewport.width}px`;
          overlay.style.height = `${viewport.height}px`;
        }
      }

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport
      };

      await page.render(renderContext).promise;
      this.currentPage = pageNumber;
    } catch (error) {
      console.error('Error rendering page:', error);
      this.error = 'Failed to render PDF page.';
    }
  }

  onFieldClick(field: any) {
    if (field.type === 'signature') {
      this.activeField = field;
      this.signatureMode = 'draw';
    } else {
      this.activeField = field;
    }
  }

  finishEditingField() {
    if (this.activeField) {
      this.activeField.signed = true;
      this.activeField = null;
    }
  }

  async signField() {
    if (!this.activeField) return;

    const field = this.activeField;
    let value = '';

    if (this.signatureMode === 'draw') {
      if (!this.signaturePad || this.signaturePad.isEmpty()) {
        this.error = 'Please draw your signature first.';
        return;
      }
      value = this.signaturePad.toDataURL();
    } else if (this.signatureMode === 'type') {
      if (!this.typedName || !this.selectedFont) {
        this.error = 'Please type your name and select a font.';
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'black';
      ctx.font = `36px '${this.selectedFont}'`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(this.typedName, canvas.width / 2, canvas.height / 2);
      value = canvas.toDataURL();
    }

    field.value = value;
    field.signed = true;
    this.activeField = null;

    const allFieldsSigned = this.fields.every(f => f.signed);
    if (allFieldsSigned) {
      await this.submitSignedDocument();
    }
  }

  allFieldsFilled(): boolean {
    return this.fields.every(field => field.signed);
  }

// async submitSignedDocument() {
//   try {
//     const updatedFields = this.fields.map(field => {
//       // Convert screen coordinates to PDF coordinates
//       const screenX = field.x * this.scale;
//       const screenY = field.y * this.scale;
//       const { x, y } = this.screenToPdfCoordinates(screenX, screenY);

//       return {
//         id: field.id,
//         type: field.type,
//         page: field.page,
//         x: x,                      // Converted PDF x
//         y: y,                      // Converted PDF y
//         width: field.width,
//         height: field.height,
//         value: field.value,
//         signed: field.signed
//       };
//     });

//     const response = await this.http.post(`http://localhost:8000/api/auth/sign`, {
//       envelopeId: this.envelopeId,
//       recipientId: this.recipientId,
//       fields: updatedFields
//     }).toPromise();

//     this.success = 'Document signed and uploaded successfully!';
//     await this.loadPDF(); // Re-render with updated content
//   } catch (error) {
//     console.error('Error submitting signed document:', error);
//     this.error = 'Failed to submit signed document. Please try again.';
//   }
// }
async submitSignedDocument() {
  try {
    const updatedFields = this.fields.map(field => {
      return {
        id: field.id,
        type: field.type,
        page: field.page,
        x: field.x,                // use original PDF units directly
        y: field.y,
        width: field.width,
        height: field.height,
        value: field.value,
        signed: field.signed
      };
    });

    const response = await this.http.post(`http://localhost:8000/api/auth/sign`, {
      envelopeId: this.envelopeId,
      recipientId: this.recipientId,
      fields: updatedFields
    }).toPromise();

    this.success = 'Document signed and uploaded successfully!';
    await this.loadPDF();
  } catch (error) {
    console.error('Error submitting signed document:', error);
    this.error = 'Failed to submit signed document. Please try again.';
  }
}
  prevPage() {
    if (this.currentPage > 1) {
      this.renderPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.renderPage(this.currentPage + 1);
    }
  }

   pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
    if (!this.originalViewport) return { x, y };

    const canvasX = x * this.scale;
    const canvasY = (this.originalViewport.height - y) * this.scale;

    return { x: canvasX, y: canvasY };
  }

  screenToPdfCoordinates(screenX: number, screenY: number): { x: number, y: number } {
    if (!this.originalViewport) return { x: screenX, y: screenY };

    return {
      x: screenX / this.scale,
      y: this.originalViewport.height - (screenY / this.scale)
    };
  }

getFieldPosition(field: Field): any {
  const screenCoords = this.pdfToScreenCoordinates(field.x, field.y);
  const extraHeight = field.type === 'signature' && field.signed ? 20 : 0;

  return {
    position: 'absolute',
    left: `${screenCoords.x}px`,
    top: `${screenCoords.y}px`,
    width: `${field.width * this.scale}px`,
    height: `${(field.height * this.scale) + extraHeight}px`,
    transform: 'none'
  };
}
  
}

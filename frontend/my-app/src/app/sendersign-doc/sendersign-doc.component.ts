// import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../Service/user.service';
// import * as pdfjsLib from 'pdfjs-dist';
// import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';

// interface SignatureField {
//   id: string;
//   x: number;
//   y: number;
//   page: number;
//   width: number;
//   height: number;
//   signatureData?: string;
// }

// @Component({
//   selector: 'app-sendersign-doc',
//   imports: [CommonModule, DragDropModule],
//   standalone: true,
//   templateUrl: './sendersign-doc.component.html',
//   styleUrls: ['./sendersign-doc.component.css']
// })
// export class SendersignDocComponent implements OnInit, AfterViewInit {
//   @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLCanvasElement>;

//   documentId: string = '';
//   envelopeId: string = '';
//   document: any;
//   isDrawing = false;
//   signatureData: string = '';
//   signatureFields: SignatureField[] = [];
//   currentPage = 1;
//   totalPages = 1;
//   signatureSize = {
//     width: 120,
//     height: 50
//   };
//   private pdfDoc: any = null;
//   private originalViewport: any = null;
//   private scale = 1.5;

//   constructor(
//     private route: ActivatedRoute,
//     private http: HttpClient,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//   }

//   private getHeaders(): HttpHeaders {
//     const token = this.authService.getToken();
//     return new HttpHeaders().set('Authorization', `Bearer ${token}`);
//   }

//   ngOnInit() {
//     this.route.params.subscribe(params => {
//       this.documentId = params['id'];
//       if (this.documentId) {
//         this.route.queryParams.subscribe(queryParams => {
//           this.envelopeId = queryParams['envelopeId'];
//           this.loadDocument();
//         });
//       }
//     });
//   }

//   ngAfterViewInit() {
//     // Initialize signature canvas
//     const signatureCtx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (signatureCtx) {
//       signatureCtx.strokeStyle = '#000000';
//       signatureCtx.lineWidth = 2;
//     }
//   }

//   loadDocument() {
//     const headers = this.getHeaders();
//     this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, { headers })
//       .subscribe({
//         next: (response: any) => {
//           const doc = response.envelope.documents?.find((d: any) => d._id === this.documentId);
//           if (doc) {
//             this.document = doc;
//             // Use preparedFilePath if available, otherwise use original filePath
//             const pdfPath = doc.preparedFilePath || doc.filePath;
//             this.loadPDF(pdfPath);
            
//             // Fetch any existing signature fields
//             this.fetchSignatureFields();
//           } else {
//             console.error('Document not found in envelope');
//           }
//         },
//         error: (error) => {
//           console.error('Error loading document:', error);
//         }
//       });
//   }

//   fetchSignatureFields() {
//     const headers = this.getHeaders();
//     this.http.get(`http://localhost:8000/api/auth/documents/${this.documentId}/fields`, { headers })
//       .subscribe({
//         next: (response: any) => {
//           if (response.fields) {
//             // Handle existing signature fields
//             response.fields.forEach((field: any) => {
//               if (field.type === 'signature' && field.value) {
//                 this.signatureData = field.value;
//                 this.signatureFields.push({
//                   id: field.id,
//                   x: field.x,
//                   y: field.y,
//                   page: field.page,
//                   width: field.width,
//                   height: field.height
//                 });
//               }
//             });
//           }
//         },
//         error: (error) => {
//           console.error('Error fetching signature fields:', error);
//         }
//       });
//   }

//   async loadPDF(pdfPath: string) {
//     if (!pdfPath) {
//       console.error('No file path available');
//       return;
//     }

//     try {
//       const pdfUrl = `http://localhost:8000${pdfPath}`;
//       const loadingTask = pdfjsLib.getDocument(pdfUrl);
//       this.pdfDoc = await loadingTask.promise;
//       this.totalPages = this.pdfDoc.numPages;
//       await this.renderPage(1);
//     } catch (error) {
//       console.error('Error loading PDF:', error);
//     }
//   }

//   async renderPage(pageNumber: number) {
//     if (!this.pdfDoc || !this.pdfViewer) {
//       return;
//     }

//     try {
//       const page = await this.pdfDoc.getPage(pageNumber);
      
//       // Store original viewport for coordinate calculations
//       this.originalViewport = page.getViewport({ scale: 1.0 });
      
//       // Create viewport with fixed scale
//       const viewport = page.getViewport({ scale: this.scale });
      
//       const canvas = this.pdfViewer.nativeElement;
//       const context = canvas.getContext('2d');
      
//       if (!context) {
//         console.error('Could not get canvas context');
//         return;
//       }

//       canvas.height = viewport.height;
//       canvas.width = viewport.width;
      
//       await page.render({
//         canvasContext: context,
//         viewport: viewport
//       }).promise;

//       this.currentPage = pageNumber;
//     } catch (error) {
//       console.error('Error rendering page:', error);
//     }
//   }

//   // Convert screen coordinates to PDF coordinates
//   private screenToPdfCoordinates(x: number, y: number): { x: number, y: number } {
//     if (!this.originalViewport) return { x, y };

//     // Convert to PDF coordinates
//     const pdfX = x / this.scale;
//     // In PDF coordinates, Y=0 is at the bottom, so we need to invert from the top
//     const pdfY = (this.originalViewport.height - (y / this.scale));

//     return { x: pdfX, y: pdfY };
//   }

//   // Convert PDF coordinates to screen coordinates
//   private pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
//     if (!this.originalViewport) return { x, y };

//     // Convert from PDF coordinates to screen coordinates
//     const screenX = x * this.scale;
//     // Convert from PDF's bottom-origin to screen's top-origin coordinate system
//     const screenY = (this.originalViewport.height - y) * this.scale;

//     return {
//       x: screenX,
//       y: screenY
//     };
//   }

//   // Navigation methods
//   async prevPage() {
//     if (this.currentPage > 1) {
//       await this.renderPage(this.currentPage - 1);
//     }
//   }

//   async nextPage() {
//     if (this.currentPage < this.totalPages) {
//       await this.renderPage(this.currentPage + 1);
//     }
//   }

//   startDrawing(event: MouseEvent) {
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       this.isDrawing = true;
//       ctx.beginPath();
//       ctx.moveTo(
//         event.clientX - canvas.getBoundingClientRect().left,
//         event.clientY - canvas.getBoundingClientRect().top
//       );
//     }
//   }

//   draw(event: MouseEvent) {
//     if (!this.isDrawing) return;
    
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.lineTo(
//         event.clientX - canvas.getBoundingClientRect().left,
//         event.clientY - canvas.getBoundingClientRect().top
//       );
//       ctx.stroke();
//     }
//   }

//   stopDrawing() {
//     this.isDrawing = false;
//     this.signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
//   }

//   clearSignature() {
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       this.signatureData = '';
//     }
//   }

//   updateSignaturePosition(event: MouseEvent) {
//     const canvas = this.pdfViewer.nativeElement;
//     const rect = canvas.getBoundingClientRect();
    
//     // Get the exact click position relative to the canvas
//     const clickX = event.clientX - rect.left;
//     const clickY = event.clientY - rect.top;

//     // Convert to PDF coordinates first
//     const pdfCoords = this.screenToPdfCoordinates(clickX, clickY);
    
//     // Convert back to screen coordinates for display
//     const screenCoords = this.pdfToScreenCoordinates(pdfCoords.x, pdfCoords.y);
    
//     // Add new signature field
//     const newField: SignatureField = {
//       id: `sig-${Date.now()}`,
//       x: screenCoords.x,
//       y: screenCoords.y,
//       page: this.currentPage,
//       width: this.signatureSize.width,
//       height: this.signatureSize.height
//     };
    
//     this.signatureFields.push(newField);
//     console.log('Added new signature field:', newField);
//     console.log('PDF coordinates:', pdfCoords);
//     console.log('Screen coordinates:', screenCoords);
//   }

//   async submitSignature() {
//     if (!this.signatureData) {
//       alert('Please draw a signature first');
//       return;
//     }

//     // Convert all signature positions to PDF coordinates
//     const signaturePayloads = this.signatureFields.map(field => {
//       const pdfCoords = this.screenToPdfCoordinates(field.x, field.y);
//       return {
//         signature: this.signatureData,
//         x: pdfCoords.x,
//         y: pdfCoords.y,
//         pageNumber: field.page,
//         width: field.width / this.scale,
//         height: field.height / this.scale
//       };
//     });

//     const headers = this.getHeaders();

//     try {
//       console.log('Submitting signatures for document:', this.documentId);
      
//       // Submit all signatures
//       for (const payload of signaturePayloads) {
//         await this.http.post(
//           `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
//           payload,
//           { headers }
//         ).toPromise();
//       }

//       // Clear after successful save
//       this.clearSignature();
//       this.signatureFields = [];
      
//       console.log('Document signed successfully, navigating to prepare with:', {
//         documentId: this.documentId,
//         envelopeId: this.envelopeId
//       });
      
//       alert('Document signed successfully!');
//       this.router.navigate(['/prepare', this.documentId], { 
//         queryParams: { envelopeId: this.envelopeId }
//       });
//     } catch (error) {
//       console.error('Error signing document:', error);
//       alert('Failed to sign document. Please try again.');
//     }
//   }

//   removeSignature(fieldId: string) {
//     this.signatureFields = this.signatureFields.filter(field => field.id !== fieldId);
//   }

//   onDragEnded(event: CdkDragEnd, field: SignatureField) {
//     // Get the total drag distance
//     const dragDistance = event.source.getFreeDragPosition();
    
//     // Update the field's position
//     field.x += dragDistance.x;
//     field.y += dragDistance.y;
    
//     // Reset the drag element's position
//     event.source.reset();
    
//     console.log('Updated field position:', {
//       id: field.id,
//       x: field.x,
//       y: field.y
//     });
//   }
// }

// import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../Service/user.service';
// import * as pdfjsLib from 'pdfjs-dist';
// import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
// import { FormsModule } from '@angular/forms';

// interface SignatureField {
//   id: string;
//   x: number;
//   y: number;
//   page: number;
//   width: number;
//   height: number;
//   signatureData?: string;
// }

// @Component({
//   selector: 'app-sendersign-doc',
//   imports: [CommonModule, DragDropModule, FormsModule],
//   standalone: true,
//   templateUrl: './sendersign-doc.component.html',
//   styleUrls: ['./sendersign-doc.component.css']
// })
// export class SendersignDocComponent implements OnInit, AfterViewInit {
//   @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLCanvasElement>;

//   documentId: string = '';
//   envelopeId: string = '';
//   document: any;
//   isDrawing = false;
//   signatureData: string = '';
//   signatureFields: SignatureField[] = [];
//   currentPage = 1;
//   totalPages = 1;
//   signatureSize = { width: 120, height: 50 };
//   private pdfDoc: any = null;
//   private originalViewport: any = null;
//   private scale = 1.5;

//   // Typed Signature State
//   typedName: string = '';
//   selectedFont: string = '';
//   fonts: string[] = ['Great Vibes', 'Pacifico', 'Dancing Script'];

//   constructor(
//     private route: ActivatedRoute,
//     private http: HttpClient,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//   }

//   ngOnInit() {
//     this.route.params.subscribe(params => {
//       this.documentId = params['id'];
//       if (this.documentId) {
//         this.route.queryParams.subscribe(queryParams => {
//           this.envelopeId = queryParams['envelopeId'];
//           this.loadDocument();
//         });
//       }
//     });
//   }

//   ngAfterViewInit() {
//     const signatureCtx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (signatureCtx) {
//       signatureCtx.strokeStyle = '#000000';
//       signatureCtx.lineWidth = 2;
//     }
//   }

//   private getHeaders(): HttpHeaders {
//     const token = this.authService.getToken();
//     return new HttpHeaders().set('Authorization', `Bearer ${token}`);
//   }

//   loadDocument() {
//     const headers = this.getHeaders();
//     this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, { headers }).subscribe({
//       next: (response: any) => {
//         const doc = response.envelope.documents?.find((d: any) => d._id === this.documentId);
//         if (doc) {
//           this.document = doc;
//           const pdfPath = doc.preparedFilePath || doc.filePath;
//           this.loadPDF(pdfPath);
//           this.fetchSignatureFields();
//         }
//       },
//       error: error => console.error('Error loading document:', error)
//     });
//   }

//   fetchSignatureFields() {
//     const headers = this.getHeaders();
//     this.http.get(`http://localhost:8000/api/auth/documents/${this.documentId}/fields`, { headers }).subscribe({
//       next: (response: any) => {
//         if (response.fields) {
//           response.fields.forEach((field: any) => {
//             if (field.type === 'signature' && field.value) {
//               this.signatureData = field.value;
//               this.signatureFields.push({
//                 id: field.id,
//                 x: field.x,
//                 y: field.y,
//                 page: field.page,
//                 width: field.width,
//                 height: field.height
//               });
//             }
//           });
//         }
//       },
//       error: error => console.error('Error fetching signature fields:', error)
//     });
//   }

//   async loadPDF(pdfPath: string) {
//     if (!pdfPath) return;
//     try {
//       const pdfUrl = `http://localhost:8000${pdfPath}`;
//       const loadingTask = pdfjsLib.getDocument(pdfUrl);
//       this.pdfDoc = await loadingTask.promise;
//       this.totalPages = this.pdfDoc.numPages;
//       await this.renderPage(1);
//     } catch (error) {
//       console.error('Error loading PDF:', error);
//     }
//   }

//   async renderPage(pageNumber: number) {
//     if (!this.pdfDoc || !this.pdfViewer) return;
//     try {
//       const page = await this.pdfDoc.getPage(pageNumber);
//       this.originalViewport = page.getViewport({ scale: 1.0 });
//       const viewport = page.getViewport({ scale: this.scale });
//       const canvas = this.pdfViewer.nativeElement;
//       const context = canvas.getContext('2d');
//       if (!context) return;
//       canvas.height = viewport.height;
//       canvas.width = viewport.width;
//       await page.render({ canvasContext: context, viewport: viewport }).promise;
//       this.currentPage = pageNumber;
//     } catch (error) {
//       console.error('Error rendering page:', error);
//     }
//   }

//   screenToPdfCoordinates(x: number, y: number): { x: number, y: number } {
//     const pdfX = x / this.scale;
//     const pdfY = (this.originalViewport.height - (y / this.scale));
//     return { x: pdfX, y: pdfY };
//   }

//   pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
//     const screenX = x * this.scale;
//     const screenY = (this.originalViewport.height - y) * this.scale;
//     return { x: screenX, y: screenY };
//   }

//   async prevPage() {
//     if (this.currentPage > 1) await this.renderPage(this.currentPage - 1);
//   }

//   async nextPage() {
//     if (this.currentPage < this.totalPages) await this.renderPage(this.currentPage + 1);
//   }

//   startDrawing(event: MouseEvent) {
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       this.isDrawing = true;
//       ctx.beginPath();
//       ctx.moveTo(event.offsetX, event.offsetY);
//     }
//   }

//   draw(event: MouseEvent) {
//     if (!this.isDrawing) return;
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.lineTo(event.offsetX, event.offsetY);
//       ctx.stroke();
//     }
//   }

//   stopDrawing() {
//     this.isDrawing = false;
//     this.signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
//   }

//   clearSignature() {
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
//     this.signatureData = '';
//   }

//   updateSignaturePosition(event: MouseEvent) {
//     const rect = this.pdfViewer.nativeElement.getBoundingClientRect();
//     const clickX = event.clientX - rect.left;
//     const clickY = event.clientY - rect.top;
//     const pdfCoords = this.screenToPdfCoordinates(clickX, clickY);
//     const screenCoords = this.pdfToScreenCoordinates(pdfCoords.x, pdfCoords.y);
//     this.signatureFields.push({
//       id: `sig-${Date.now()}`,
//       x: screenCoords.x,
//       y: screenCoords.y,
//       page: this.currentPage,
//       width: this.signatureSize.width,
//       height: this.signatureSize.height,
//       signatureData: this.signatureData
//     });
//   }

//   async submitSignature() {
//     if (!this.signatureData) {
//       alert('Please draw or type a signature first');
//       return;
//     }

//     const signaturePayloads = this.signatureFields.map(field => {
//       const pdfCoords = this.screenToPdfCoordinates(field.x, field.y);
//       return {
//         signature: field.signatureData || this.signatureData,
//         x: pdfCoords.x,
//         y: pdfCoords.y,
//         pageNumber: field.page,
//         width: field.width / this.scale,
//         height: field.height / this.scale
//       };
//     });

//     const headers = this.getHeaders();

//     try {
//       for (const payload of signaturePayloads) {
//         await this.http.post(
//           `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
//           payload,
//           { headers }
//         ).toPromise();
//       }

//       this.clearSignature();
//       this.signatureFields = [];
//       alert('Document signed successfully!');
//       this.router.navigate(['/prepare', this.documentId], {
//         queryParams: { envelopeId: this.envelopeId }
//       });
//     } catch (error) {
//       console.error('Error signing document:', error);
//       alert('Failed to sign document. Please try again.');
//     }
//   }

//   removeSignature(fieldId: string) {
//     this.signatureFields = this.signatureFields.filter(field => field.id !== fieldId);
//   }

//   onDragEnded(event: CdkDragEnd, field: SignatureField) {
//     const dragDistance = event.source.getFreeDragPosition();
//     field.x += dragDistance.x;
//     field.y += dragDistance.y;
//     event.source.reset();
//   }

//   addTypedSignature() {
//     if (!this.typedName || !this.selectedFont) {
//       alert('Please type your name and select a font.');
//       return;
//     }

//     const canvas = document.createElement('canvas');
//     canvas.width = 300;
//     canvas.height = 100;

//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = 'black';
//     ctx.font = `36px '${this.selectedFont}'`;
//     ctx.textBaseline = 'middle';
//     ctx.fillText(this.typedName, 10, canvas.height / 2);

//     this.signatureData = canvas.toDataURL('image/png');
//     alert('Typed signature created! Click on document to place it.');
//   }
// }


// import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../Service/user.service';
// import * as pdfjsLib from 'pdfjs-dist';
// import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
// import { FormsModule } from '@angular/forms';

// interface SignatureField {
//   id: string;
//   x: number;
//   y: number;
//   page: number;
//   width: number;
//   height: number;
//   signatureData: string;
// }

// @Component({
//   selector: 'app-sendersign-doc',
//   imports: [CommonModule, DragDropModule, FormsModule],
//   standalone: true,
//   templateUrl: './sendersign-doc.component.html',
//   styleUrls: ['./sendersign-doc.component.css']
// })
// export class SendersignDocComponent implements OnInit, AfterViewInit {
//   @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLCanvasElement>;

//   documentId: string = '';
//   envelopeId: string = '';
//   document: any;
//   isDrawing = false;
//   signatureData: string = '';
//   signatureFields: SignatureField[] = [];
//   currentPage = 1;
//   totalPages = 1;
//   signatureSize = { width: 120, height: 50 };
//   private pdfDoc: any = null;
//   private originalViewport: any = null;
//   private scale = 1.5;

//   // Typed Signature State
//   typedName: string = '';
//   selectedFont: string = '';
//   fonts: string[] = ['Great Vibes', 'Pacifico', 'Dancing Script'];

//   constructor(
//     private route: ActivatedRoute,
//     private http: HttpClient,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//   }

//   ngOnInit() {
//     this.route.params.subscribe(params => {
//       this.documentId = params['id'];
//       if (this.documentId) {
//         this.route.queryParams.subscribe(queryParams => {
//           this.envelopeId = queryParams['envelopeId'];
//           this.loadDocument();
//         });
//       }
//     });
//   }

//   ngAfterViewInit() {
//     const ctx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (ctx) {
//       ctx.strokeStyle = '#000000';
//       ctx.lineWidth = 2;
//     }
//   }

//   private getHeaders(): HttpHeaders {
//     const token = this.authService.getToken();
//     return new HttpHeaders().set('Authorization', `Bearer ${token}`);
//   }

//   loadDocument() {
//     const headers = this.getHeaders();
//     this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, { headers }).subscribe({
//       next: (response: any) => {
//         const doc = response.envelope.documents?.find((d: any) => d._id === this.documentId);
//         if (doc) {
//           this.document = doc;
//           const pdfPath = doc.preparedFilePath || doc.filePath;
//           this.loadPDF(pdfPath);
//         }
//       },
//       error: error => console.error('Error loading document:', error)
//     });
//   }

//   async loadPDF(pdfPath: string) {
//     try {
//       const pdfUrl = `http://localhost:8000${pdfPath}`;
//       const loadingTask = pdfjsLib.getDocument(pdfUrl);
//       this.pdfDoc = await loadingTask.promise;
//       this.totalPages = this.pdfDoc.numPages;
//       await this.renderPage(1);
//     } catch (error) {
//       console.error('Error loading PDF:', error);
//     }
//   }

//   async renderPage(pageNumber: number) {
//     if (!this.pdfDoc || !this.pdfViewer) return;
//     const page = await this.pdfDoc.getPage(pageNumber);
//     this.originalViewport = page.getViewport({ scale: 1.0 });
//     const viewport = page.getViewport({ scale: this.scale });
//     const canvas = this.pdfViewer.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;
//     canvas.height = viewport.height;
//     canvas.width = viewport.width;
//     await page.render({ canvasContext: ctx, viewport }).promise;
//     this.currentPage = pageNumber;
//   }

//   screenToPdfCoordinates(x: number, y: number): { x: number, y: number } {
//     const pdfX = x / this.scale;
//     const pdfY = (this.originalViewport.height - (y / this.scale));
//     return { x: pdfX, y: pdfY };
//   }

//   pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
//     const screenX = x * this.scale;
//     const screenY = (this.originalViewport.height - y) * this.scale;
//     return { x: screenX, y: screenY };
//   }

//   async prevPage() {
//     if (this.currentPage > 1) await this.renderPage(this.currentPage - 1);
//   }

//   async nextPage() {
//     if (this.currentPage < this.totalPages) await this.renderPage(this.currentPage + 1);
//   }

//   startDrawing(event: MouseEvent) {
//     const ctx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (ctx) {
//       this.isDrawing = true;
//       ctx.beginPath();
//       ctx.moveTo(event.offsetX, event.offsetY);
//     }
//   }

//   draw(event: MouseEvent) {
//     if (!this.isDrawing) return;
//     const ctx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (ctx) {
//       ctx.lineTo(event.offsetX, event.offsetY);
//       ctx.stroke();
//     }
//   }

//   stopDrawing() {
//     this.isDrawing = false;
//     this.signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
//   }

//   clearSignature() {
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
//     this.signatureData = '';
//   }

//   updateSignaturePosition(event: MouseEvent) {
//     if (!this.signatureData) {
//       alert('Please draw or type a signature first.');
//       return;
//     }

//     const rect = this.pdfViewer.nativeElement.getBoundingClientRect();
//     const clickX = event.clientX - rect.left;
//     const clickY = event.clientY - rect.top;
//     const pdfCoords = this.screenToPdfCoordinates(clickX, clickY);
//     const screenCoords = this.pdfToScreenCoordinates(pdfCoords.x, pdfCoords.y);

//     this.signatureFields.push({
//       id: `sig-${Date.now()}`,
//       x: screenCoords.x,
//       y: screenCoords.y,
//       page: this.currentPage,
//       width: this.signatureSize.width,
//       height: this.signatureSize.height,
//       signatureData: this.signatureData
//     });
//   }

//   async submitSignature() {
//     if (!this.signatureFields.length) {
//       alert('Please place at least one signature.');
//       return;
//     }

//     const headers = this.getHeaders();

//     const payloads = this.signatureFields.map(field => {
//       const pdfCoords = this.screenToPdfCoordinates(field.x, field.y);
//       return {
//         signature: field.signatureData,
//         x: pdfCoords.x,
//         y: pdfCoords.y,
//         pageNumber: field.page,
//         width: field.width / this.scale,
//         height: field.height / this.scale
//       };
//     });

//     try {
//       for (const payload of payloads) {
//         await this.http.post(
//           `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
//           payload,
//           { headers }
//         ).toPromise();
//       }

//       this.clearSignature();
//       this.signatureFields = [];
//       alert('Document signed successfully!');
//       this.router.navigate(['/prepare', this.documentId], {
//         queryParams: { envelopeId: this.envelopeId }
//       });
//     } catch (error) {
//       console.error('Signature error:', error);
//       alert('Failed to submit signatures.');
//     }
//   }

//   removeSignature(fieldId: string) {
//     this.signatureFields = this.signatureFields.filter(field => field.id !== fieldId);
//   }

//   onDragEnded(event: CdkDragEnd, field: SignatureField) {
//     const drag = event.source.getFreeDragPosition();
//     field.x += drag.x;
//     field.y += drag.y;
//     event.source.reset();
//   }

//   addTypedSignature() {
//     if (!this.typedName || !this.selectedFont) {
//       alert('Please type your name and select a font.');
//       return;
//     }

//     const canvas = document.createElement('canvas');
//     canvas.width = 300;
//     canvas.height = 100;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     ctx.fillStyle = 'black';
//     ctx.font = `36px '${this.selectedFont}'`;
//     ctx.textBaseline = 'middle';
//     ctx.fillText(this.typedName, 10, canvas.height / 2);

//     this.signatureData = canvas.toDataURL('image/png');
//     alert('Typed signature generated! Click on the document to place it.');
//   }
// }



// import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../Service/user.service';
// import * as pdfjsLib from 'pdfjs-dist';
// import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
// import { FormsModule } from '@angular/forms';

// interface SignatureField {
//   id: string;
//   x: number;
//   y: number;
//   page: number;
//   width: number;
//   height: number;
//   signatureData: string;
// }

// @Component({
//   selector: 'app-sendersign-doc',
//   imports: [CommonModule, DragDropModule, FormsModule],
//   standalone: true,
//   templateUrl: './sendersign-doc.component.html',
//   styleUrls: ['./sendersign-doc.component.css']
// })
// export class SendersignDocComponent implements OnInit, AfterViewInit {
//   @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLCanvasElement>;

//   documentId: string = '';
//   envelopeId: string = '';
//   document: any;
//   isDrawing = false;

//   drawnSignatureData: string = '';
//   typedSignatureData: string = '';
//   currentSignatureData: string = '';
//   signatureMode: 'drawn' | 'typed' = 'drawn';

//   signatureFields: SignatureField[] = [];
//   currentPage = 1;
//   totalPages = 1;
//   signatureSize = { width: 120, height: 50 };
//   private pdfDoc: any = null;
//   private originalViewport: any = null;
//   private scale = 1.5;

//   typedName: string = '';
//   selectedFont: string = '';
//   fonts: string[] = ['Great Vibes', 'Pacifico', 'Dancing Script'];


//   stampImageData: string = '';
// stampFields: any[] = [];

//   constructor(
//     private route: ActivatedRoute,
//     private http: HttpClient,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//   }

//   ngOnInit() {
//     this.route.params.subscribe(params => {
//       this.documentId = params['id'];
//       if (this.documentId) {
//         this.route.queryParams.subscribe(queryParams => {
//           this.envelopeId = queryParams['envelopeId'];
//           this.loadDocument();
//         });
//       }
//     });
//   }

//   ngAfterViewInit() {
//     const ctx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (ctx) {
//       ctx.strokeStyle = '#000000';
//       ctx.lineWidth = 2;
//     }
//   }

//   private getHeaders(): HttpHeaders {
//     const token = this.authService.getToken();
//     return new HttpHeaders().set('Authorization', `Bearer ${token}`);
//   }

//   loadDocument() {
//     const headers = this.getHeaders();
//     this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, { headers }).subscribe({
//       next: (response: any) => {
//         const doc = response.envelope.documents?.find((d: any) => d._id === this.documentId);
//         if (doc) {
//           this.document = doc;
//           const pdfPath = doc.preparedFilePath || doc.filePath;
//           this.loadPDF(pdfPath);
//         }
//       },
//       error: error => console.error('Error loading document:', error)
//     });
//   }

//   async loadPDF(pdfPath: string) {
//     try {
//       const pdfUrl = `http://localhost:8000${pdfPath}`;
//       const loadingTask = pdfjsLib.getDocument(pdfUrl);
//       this.pdfDoc = await loadingTask.promise;
//       this.totalPages = this.pdfDoc.numPages;
//       await this.renderPage(1);
//     } catch (error) {
//       console.error('Error loading PDF:', error);
//     }
//   }

//   async renderPage(pageNumber: number) {
//     if (!this.pdfDoc || !this.pdfViewer) return;
//     const page = await this.pdfDoc.getPage(pageNumber);
//     this.originalViewport = page.getViewport({ scale: 1.0 });
//     const viewport = page.getViewport({ scale: this.scale });
//     const canvas = this.pdfViewer.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;
//     canvas.height = viewport.height;
//     canvas.width = viewport.width;
//     await page.render({ canvasContext: ctx, viewport }).promise;
//     this.currentPage = pageNumber;
//   }

//   screenToPdfCoordinates(x: number, y: number): { x: number, y: number } {
//     const pdfX = x / this.scale;
//     const pdfY = (this.originalViewport.height - (y / this.scale));
//     return { x: pdfX, y: pdfY };
//   }

//   pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
//     const screenX = x * this.scale;
//     const screenY = (this.originalViewport.height - y) * this.scale;
//     return { x: screenX, y: screenY };
//   }

//   async prevPage() {
//     if (this.currentPage > 1) await this.renderPage(this.currentPage - 1);
//   }

//   async nextPage() {
//     if (this.currentPage < this.totalPages) await this.renderPage(this.currentPage + 1);
//   }

//   startDrawing(event: MouseEvent) {
//     const ctx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (ctx) {
//       this.isDrawing = true;
//       ctx.beginPath();
//       ctx.moveTo(event.offsetX, event.offsetY);
//     }
//   }

//   draw(event: MouseEvent) {
//     if (!this.isDrawing) return;
//     const ctx = this.signatureCanvas.nativeElement.getContext('2d');
//     if (ctx) {
//       ctx.lineTo(event.offsetX, event.offsetY);
//       ctx.stroke();
//     }
//   }

//   stopDrawing() {
//     this.isDrawing = false;
//     this.drawnSignatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
//     this.currentSignatureData = this.drawnSignatureData;
//     this.signatureMode = 'drawn';
//   }

//   clearSignature() {
//     const canvas = this.signatureCanvas.nativeElement;
//     const ctx = canvas.getContext('2d');
//     if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
//     this.drawnSignatureData = '';
//     this.typedSignatureData = '';
//     this.currentSignatureData = '';
//   }

//   updateSignaturePosition(event: MouseEvent) {
//     if (!this.currentSignatureData) {
//       alert('Please draw or type a signature first.');
//       return;
//     }

//     const rect = this.pdfViewer.nativeElement.getBoundingClientRect();
//     const clickX = event.clientX - rect.left;
//     const clickY = event.clientY - rect.top;
//     const pdfCoords = this.screenToPdfCoordinates(clickX, clickY);
//     const screenCoords = this.pdfToScreenCoordinates(pdfCoords.x, pdfCoords.y);

//     this.signatureFields.push({
//       id: `sig-${Date.now()}`,
//       x: screenCoords.x,
//       y: screenCoords.y,
//       page: this.currentPage,
//       width: this.signatureSize.width,
//       height: this.signatureSize.height,
//       signatureData: this.currentSignatureData // ➤ Unique per signature
//     });
//   }

//   async submitSignature() {
//     if (!this.signatureFields.length) {
//       alert('Please place at least one signature.');
//       return;
//     }

//     const headers = this.getHeaders();

//     const payloads = this.signatureFields.map(field => {
//       const pdfCoords = this.screenToPdfCoordinates(field.x, field.y);
//       return {
//         signature: field.signatureData,
//         x: pdfCoords.x,
//         y: pdfCoords.y,
//         pageNumber: field.page,
//         width: field.width / this.scale,
//         height: field.height / this.scale
//       };
//     });

//     try {
//       for (const payload of payloads) {
//         await this.http.post(
//           `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
//           payload,
//           { headers }
//         ).toPromise();
//       }

//       this.clearSignature();
//       this.signatureFields = [];
//       alert('Document signed successfully!');
//       this.router.navigate(['/prepare', this.documentId], {
//         queryParams: { envelopeId: this.envelopeId }
//       });
//     } catch (error) {
//       console.error('Signature error:', error);
//       alert('Failed to submit signatures.');
//     }
//   }

//   removeSignature(fieldId: string) {
//     this.signatureFields = this.signatureFields.filter(field => field.id !== fieldId);
//   }

//   onDragEnded(event: CdkDragEnd, field: SignatureField) {
//     const drag = event.source.getFreeDragPosition();
//     field.x += drag.x;
//     field.y += drag.y;
//     event.source.reset();
//   }

//   addTypedSignature() {
//     if (!this.typedName || !this.selectedFont) {
//       alert('Please type your name and select a font.');
//       return;
//     }

//     const canvas = document.createElement('canvas');
//     canvas.width = 300;
//     canvas.height = 100;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     ctx.fillStyle = 'black';
//     ctx.font = `36px '${this.selectedFont}'`;
//     ctx.textBaseline = 'middle';
//     ctx.fillText(this.typedName, 10, canvas.height / 2);

//     this.typedSignatureData = canvas.toDataURL('image/png');
//     this.currentSignatureData = this.typedSignatureData;
//     this.signatureMode = 'typed';

//     alert('Typed signature generated! Click on the document to place it.');
//   }





  
// }




import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../Service/user.service';
import * as pdfjsLib from 'pdfjs-dist';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

interface SignatureField {
  id: string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
  signatureData: string;
}

@Component({
  selector: 'app-sendersign-doc',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './sendersign-doc.component.html',
  styleUrls: ['./sendersign-doc.component.css']
})
export class SendersignDocComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLCanvasElement>;

  documentId: string = '';
  envelopeId: string = '';
  document: any;
  isDrawing = false;

  drawnSignatureData: string = '';
  typedSignatureData: string = '';
  currentSignatureData: string = '';
  signatureMode: 'drawn' | 'typed' = 'drawn';

  signatureFields: SignatureField[] = [];
  stampFields: SignatureField[] = [];

  currentPage = 1;
  totalPages = 1;
  signatureSize = { width: 120, height: 50 };
  private pdfDoc: any = null;
  private originalViewport: any = null;
  private scale = 1.5;

  typedName: string = '';
  selectedFont: string = '';
fonts: string[] = ['Great Vibes', 'Alex Brush', 'Dancing Script', 'Ballet',
  'Love Light'];
// fonts = ['Ballet', 'Arial', 'Courier New'];

stampImageData: string = '';

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
      this.documentId = params['id'];
      if (this.documentId) {
        this.route.queryParams.subscribe(queryParams => {
          this.envelopeId = queryParams['envelopeId'];
          this.loadDocument();
        });
      }
    });
  }

  ngAfterViewInit() {
    const ctx = this.signatureCanvas.nativeElement.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadDocument() {
    const headers = this.getHeaders();
    this.http.get(`http://localhost:8000/api/auth/envelope/${this.envelopeId}`, { headers }).subscribe({
      next: (response: any) => {
        const doc = response.envelope.documents?.find((d: any) => d._id === this.documentId);
        if (doc) {
          this.document = doc;
          const pdfPath = doc.preparedFilePath || doc.filePath;
          this.loadPDF(pdfPath);
        }
      },
      error: error => console.error('Error loading document:', error)
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
    const page = await this.pdfDoc.getPage(pageNumber);
    this.originalViewport = page.getViewport({ scale: 1.0 });
    const viewport = page.getViewport({ scale: this.scale });
    const canvas = this.pdfViewer.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport }).promise;
    this.currentPage = pageNumber;
  }

  screenToPdfCoordinates(x: number, y: number): { x: number, y: number } {
    const pdfX = x / this.scale;
    const pdfY = (this.originalViewport.height - (y / this.scale));
    return { x: pdfX, y: pdfY };
  }

  pdfToScreenCoordinates(x: number, y: number): { x: number, y: number } {
    const screenX = x * this.scale;
    const screenY = (this.originalViewport.height - y) * this.scale;
    return { x: screenX, y: screenY };
  }

  async prevPage() {
    if (this.currentPage > 1) await this.renderPage(this.currentPage - 1);
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) await this.renderPage(this.currentPage + 1);
  }

  startDrawing(event: MouseEvent) {
    const ctx = this.signatureCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(event.offsetX, event.offsetY);
    }
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing) return;
    const ctx = this.signatureCanvas.nativeElement.getContext('2d');
    if (ctx) {
      ctx.lineTo(event.offsetX, event.offsetY);
      ctx.stroke();
    }
  }

  stopDrawing() {
    this.isDrawing = false;
    this.drawnSignatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
    this.currentSignatureData = this.drawnSignatureData;
    this.signatureMode = 'drawn';
  }

  clearSignature() {
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawnSignatureData = '';
    this.typedSignatureData = '';
    this.currentSignatureData = '';
  }

  updateSignaturePosition(event: MouseEvent) {
    if (!this.currentSignatureData && !this.stampImageData) {
      alert('Please draw or type a signature or upload a stamp first.');
      return;
    }

    const rect = this.pdfViewer.nativeElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const pdfCoords = this.screenToPdfCoordinates(clickX, clickY);
    const screenCoords = this.pdfToScreenCoordinates(pdfCoords.x, pdfCoords.y);

    if (this.stampImageData) {
      this.stampFields.push({
        id: `stamp-${Date.now()}`,
        x: screenCoords.x,
        y: screenCoords.y,
        page: this.currentPage,
        width: this.signatureSize.width,
        height: this.signatureSize.height,
        signatureData: this.stampImageData
      });
      
    } else {
      this.signatureFields.push({
        id: `sig-${Date.now()}`,
        x: screenCoords.x,
        y: screenCoords.y,
        page: this.currentPage,
        width: this.signatureSize.width,
        height: this.signatureSize.height,
        signatureData: this.currentSignatureData
      });
    }
  }



  async submitSignature() {
  const headers = this.getHeaders();
  const allFields = [...this.signatureFields, ...this.stampFields];

  // Show confirm dialog ONLY if no fields
  if (!allFields.length) {
    const proceed = confirm('No signatures or stamps placed. Are you sure you want to submit?');
    if (!proceed) return;

    // Even if no fields, navigate away (without alerts)
    this.router.navigate(['/prepare', this.documentId], {
      queryParams: { envelopeId: this.envelopeId }
    });
    return;
  }

  // Submit only if fields exist
  const payloads = allFields.map(field => {
    const pdfCoords = this.screenToPdfCoordinates(field.x, field.y);
    return {
      signature: field.signatureData,
      x: pdfCoords.x,
      y: pdfCoords.y,
      pageNumber: field.page,
      width: field.width / this.scale,
      height: field.height / this.scale
    };
  });

  try {
    for (const payload of payloads) {
      await this.http.post(
        `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
        payload,
        { headers }
      ).toPromise();
    }

    this.clearSignature();
    this.signatureFields = [];
    this.stampFields = [];

    alert('Document signed/stamped successfully!');
    this.router.navigate(['/prepare', this.documentId], {
      queryParams: { envelopeId: this.envelopeId }
    });
  } catch (error) {
    console.error('Signature error:', error);
    alert('Failed to submit signatures/stamps.');
  }
}



  removeSignature(fieldId: string) {
    this.signatureFields = this.signatureFields.filter(field => field.id !== fieldId);
    this.stampFields = this.stampFields.filter(field => field.id !== fieldId);
  }

  onDragEnded(event: CdkDragEnd, field: SignatureField) {
    const drag = event.source.getFreeDragPosition();
    field.x += drag.x;
    field.y += drag.y;
    event.source.reset();
  }

  addTypedSignature() {
    if (!this.typedName || !this.selectedFont) {
      alert('Please type your name and select a font.');
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
    ctx.fillText(this.typedName, 10, canvas.height / 2);

    this.typedSignatureData = canvas.toDataURL('image/png');
    this.currentSignatureData = this.typedSignatureData;
    this.signatureMode = 'typed';

    alert('Typed signature generated! Click on the document to place it.');
  }

  // ✅ Final and only handler for stamp upload
  onStampUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.stampImageData = reader.result as string;
        alert('Stamp uploaded! Click on the document to place it.');
      };
      reader.readAsDataURL(file);
    }
  }
  onResizeEnd(event: MouseEvent, field: SignatureField) {
  const element = (event.target as HTMLElement);
  field.width = element.offsetWidth;
  field.height = element.offsetHeight;
}

}




//   async submitSignature() {
//    if (!this.signatureFields.length && !this.stampFields.length) {
//   const proceed = confirm('No signatures or stamps placed. Are you sure you want to submit?');
//   if (!proceed) return;
// }

//     const headers = this.getHeaders();
//     const allFields = [...this.signatureFields, ...this.stampFields];

//     const payloads = allFields.map(field => {
//       const pdfCoords = this.screenToPdfCoordinates(field.x, field.y);
//       return {
//         signature: field.signatureData,
//         x: pdfCoords.x,
//         y: pdfCoords.y,
//         pageNumber: field.page,
//         width: field.width / this.scale,
//         height: field.height / this.scale
//       };
//     });

//     try {
//       for (const payload of payloads) {
//         await this.http.post(
//           `http://localhost:8000/api/auth/documents/${this.documentId}/sign`,
//           payload,
//           { headers }
//         ).toPromise();
//       }

//       this.clearSignature();
//       this.signatureFields = [];
//       this.stampFields = [];
//       alert('Document signed/stamped successfully!');
//       this.router.navigate(['/prepare', this.documentId], {
//         queryParams: { envelopeId: this.envelopeId }
//       });
//     } catch (error) {
//       console.error('Signature error:', error);
//       alert('Failed to submit signatures/stamps.');
//     }
//   }
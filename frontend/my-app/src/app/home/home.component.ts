import { Component } from '@angular/core';
import { EnvelopecreateComponent } from '../envelopecreate/envelopecreate.component';
// import { SignDocumentComponent } from '../sign-document/sign-document.component';
// import { EnvelopeDetailsComponent } from '../envelope-details/envelope-details.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogoutComponent } from '../user/logout/logout.component';
import { AuthService } from '../Service/user.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [EnvelopecreateComponent,FormsModule,CommonModule,RouterModule,LogoutComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
   constructor(private authService: AuthService, private router: Router) {}
  logout() {  
    this.authService.logout();
    this.router.navigate(['/login']); // navigate to login page
  }
}

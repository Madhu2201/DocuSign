import { Component } from '@angular/core';
import { AuthService } from '../../Service/user.service';
@Component({
  selector: 'app-request-password',
  imports: [],
  templateUrl: './request-password.component.html',
  styleUrl: './request-password.component.css'
})
export class RequestPasswordComponent {
 email = '';
  message = '';

  constructor(private auth: AuthService) {}

  requestReset() {
    this.auth.requestPasswordReset(this.email).subscribe({
      next: (res: any) => {
        this.message = 'Reset link sent to your email';
        console.log('Token (for testing):', res.token); // Remove in production
      },
      error: (err) => this.message = err.error.message
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../Service/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  email = '';
  token = '';
  newPassword = '';
  showResetForm = false;
  message = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.showResetForm = true;
      }
    });
  }

  requestPasswordReset() {
    this.auth.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.message = 'Reset link sent. Please check your email.';
      },
      error: (err: any) => {
        this.message = err.error.message || 'Failed to send reset link.';
      }
    });
  }

  resetPassword() {
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.message = 'Password reset successful. Redirecting...';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.message = err.error.message || 'Failed to reset password.';
      }
    });
  }
}

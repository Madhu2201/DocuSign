import { Component } from '@angular/core';
import { AuthService } from '../../Service/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from '../register/register.component';
// import { ResetPasswordComponent } from '../reset-password/reset-password.component';

@Component({
  selector: 'app-login',
  imports:[FormsModule,CommonModule,RegisterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login({ email: this.email, password: this.password }).subscribe(
      (res:any) => {
        this.auth.saveToken(res.token); // Save token with consistent key
        this.router.navigate(['/home']);
      },
      (err:any) => {
        this.message = err.error?.message || 'Login failed';
      }
    );

  }
  register() {
 this.router.navigate(['/register']);
  }
goToPasswordReset() {
    this.router.navigate(['/password-reset']);
  }

}

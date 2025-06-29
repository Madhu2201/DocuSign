import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Service/user.service'; // Adjust the path as necessary
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-register',
  imports: [CommonModule,FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.auth.register({ name: this.name, email: this.email, password: this.password })
      .subscribe({
        next: (res: any) => {
          this.auth.saveToken(res.token);
          this.router.navigate(['/login']);
        },
        error: (err) => alert(err.error.message)
      });
  }
  goToRegister() {
    this.router.navigate(['/register']);
  }
}

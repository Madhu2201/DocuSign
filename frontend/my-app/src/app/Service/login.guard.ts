import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Service/user.service';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      console.log('LoginGuard: Already logged in, redirect to /home');
      this.router.navigate(['/home']);
      return false;
    }
    console.log('LoginGuard: Not logged in, allow access to login');
    return true;
  }
}

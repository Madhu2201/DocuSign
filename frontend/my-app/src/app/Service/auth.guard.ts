import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Service/user.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      console.log('AuthGuard: Access granted');
      return true;
    }
    console.log('AuthGuard: Not logged in, redirecting to login');
    this.router.navigate(['/login']);
    return false;
  }
}

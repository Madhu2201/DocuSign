import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8000/api';
  private tokenKey = 'auth-token';

  constructor(private http: HttpClient) {}

  register(data: any) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string; user: any }>(`${this.baseUrl}/login`, credentials);
  }

  saveToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

requestPasswordReset(email: string) {
  return this.http.post(`${this.baseUrl}/request-password`, { email });
}

resetPassword(token: string, newPassword: string) {
  return this.http.post(`${this.baseUrl}/resetpassword`, { token, newPassword });
}
}

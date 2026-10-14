
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../enviornment/enviornment';
import {
  LoginRequest,
  LoginResponse,
  StudentRegisterRequest,
  StudentRegisterResponse
} from '../models/auth.model';

export type UserRole = 'Admin' | 'Student';

export interface UserProfile {
  email: string;
  fullName: string;
  expiresAt: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenKey = 'library_token';
  private readonly profileKey = 'library_profile';

  // Keep these keys for sessions created by your previous admin login.
  private readonly oldTokenKey = 'library_admin_token';
  private readonly oldProfileKey = 'library_admin_profile';

  // Existing LoginComponent can continue calling login().
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.loginAdmin(credentials);
  }

  loginAdmin(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => this.saveSession(response, 'Admin'))
      );
  }

  loginStudent(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${this.baseUrl}/student/login`,
        credentials
      )
      .pipe(
        tap(response => this.saveSession(response, 'Student'))
      );
  }

  registerStudent(
    details: StudentRegisterRequest
  ): Observable<StudentRegisterResponse> {
    return this.http.post<StudentRegisterResponse>(
      `${this.baseUrl}/student/register`,
      details
    );
  }

  private saveSession(
    response: LoginResponse,
    role: UserRole
  ): void {
    if (!response.token) {
      throw new Error('The API did not return a JWT token.');
    }

    // Never leave the previous user's session in place.
    this.logout();

    const profile: UserProfile = {
      email: response.email,
      fullName: response.fullName,
      expiresAt: response.expiresAt,
      role
    };

    sessionStorage.setItem(this.tokenKey, response.token);
    sessionStorage.setItem(
      this.profileKey,
      JSON.stringify(profile)
    );
  }

  getToken(): string | null {
    const token =
      sessionStorage.getItem(this.tokenKey) ??
      sessionStorage.getItem(this.oldTokenKey);

    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getRole(): UserRole | null {
    if (!this.getToken()) {
      return null;
    }

    const profile = this.readProfile();
    return profile?.role ?? null;
  }

  getProfile(): UserProfile | null {
    if (!this.getToken()) {
      return null;
    }

    return this.readProfile();
  }

  // Backwards-compatible method for your existing admin UI.
  getAdminProfile(): {
    email: string;
    fullName: string;
    expiresAt: string;
  } | null {
    const profile = this.getProfile();

    if (!profile || profile.role !== 'Admin') {
      return null;
    }

    return {
      email: profile.email,
      fullName: profile.fullName,
      expiresAt: profile.expiresAt
    };
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.profileKey);
    sessionStorage.removeItem(this.oldTokenKey);
    sessionStorage.removeItem(this.oldProfileKey);
  }

  private readProfile(): UserProfile | null {
    const storedProfile =
      sessionStorage.getItem(this.profileKey);

    if (storedProfile) {
      try {
        return JSON.parse(storedProfile) as UserProfile;
      } catch {
        this.logout();
        return null;
      }
    }

    // Treat an older admin-only session as an admin session.
    const oldProfile = sessionStorage.getItem(this.oldProfileKey);

    if (oldProfile) {
      try {
        const profile = JSON.parse(oldProfile);

        return {
          email: profile.email,
          fullName: profile.fullName,
          expiresAt: profile.expiresAt,
          role: 'Admin'
        };
      } catch {
        this.logout();
      }
    }

    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];

      if (!payloadPart) {
        return true;
      }

      const base64 = payloadPart
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(atob(base64));

      if (typeof payload.exp !== 'number') {
        return true;
      }

      return Date.now() >= payload.exp * 1000 - 5000;
    } catch {
      return true;
    }
  }
}

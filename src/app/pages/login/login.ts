
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';

    const email = this.email.trim();

    if (!email || !this.password) {
      this.errorMessage = 'Enter your email and password.';
      return;
    }

    this.loading = true;

    this.authService
      .login({
        email,
        password: this.password
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/books']);
        },
        error: error => {
          console.error('Admin login failed:', error);

          this.errorMessage =
            error.status === 401
              ? 'Invalid email or password.'
              : error.status === 0
                ? 'Cannot connect to the server. Check whether the API is running.'
                : 'Login failed. Please try again.';
        }
      });
  }
}

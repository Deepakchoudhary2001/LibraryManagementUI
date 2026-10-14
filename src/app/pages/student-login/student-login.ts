
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './student-login.html',
  styleUrl: './student-login.css'
})
export class StudentLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onSubmit(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.loginStudent({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        void this.router.navigate(['/student/inventory']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ??
          'Student login failed. Please check your email and password.';
      }
    });
  }
}

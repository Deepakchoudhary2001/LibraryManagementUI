
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './student-register.html',
  styleUrl: './student-register.css'
})
export class StudentRegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  mobileNumber = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  isLoading = false;

  onSubmit(): void {
    if (this.isLoading) return;

    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;

    this.authService.registerStudent({
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      mobileNumber: this.mobileNumber.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Student registered successfully!');
        void this.router.navigate(['/login/student'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ??
          (error.status === 409
            ? 'An account with this email already exists.'
            : 'Registration failed. Please check your details and try again.');
      }
    });
  }
}

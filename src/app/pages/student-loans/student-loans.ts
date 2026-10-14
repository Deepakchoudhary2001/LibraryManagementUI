
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { LoanService, StudentLoan } from '../../services/loan.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-student-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-loans.html',
  styleUrl: './student-loans.css'
})
export class StudentLoans implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loans: StudentLoan[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  requestingIds = new Set<number>();

  ngOnInit(): void {
    this.loadLoans();
  }

  get activeLoans(): StudentLoan[] {
    return this.loans.filter(loan => !loan.isReturned);
  }

  get returnedLoans(): StudentLoan[] {
    return this.loans.filter(loan => loan.isReturned);
  }

  get pendingReturnCount(): number {
    return this.activeLoans.filter(
      loan => loan.returnRequestStatus?.toLowerCase() === 'pending'
    ).length;
  }

  get totalRecordedFines(): number {
    return this.returnedLoans.reduce(
      (total, loan) => total + (loan.fineAmount ?? 0),
      0
    );
  }

  loadLoans(): void {
    this.loading = true;
    this.errorMessage = '';

    this.loanService.getMyLoans()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: loans => {
          this.loans = loans ?? [];
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Unable to load student loans:', error);
          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'Your student session may have expired. Please sign in again.'
              : error.status === 0
                ? 'Cannot connect to the library API. Check that the backend is running.'
                : `Unable to load your borrowed books (HTTP ${error.status}).`;
          this.cdr.markForCheck();
        }
      });
  }

  requestReturn(loan: StudentLoan): void {
    if (
      loan.isReturned ||
      this.requestingIds.has(loan.id) ||
      loan.returnRequestStatus?.toLowerCase() === 'pending'
    ) {
      return;
    }

    const confirmed = confirm(
      `Submit a return request for "${loan.bookTitle}"?\n\n` +
      `Estimated fine: ₹${loan.estimatedFineAmount ?? 0}. ` +
      `The admin will confirm the physical return.`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.requestingIds.add(loan.id);
    this.cdr.markForCheck();

    this.loanService.requestReturn(loan.id)
      .pipe(finalize(() => {
        this.requestingIds.delete(loan.id);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: response => {
          this.successMessage =
            response.message || 'Return request submitted successfully.';
          this.loadLoans();
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Return request failed:', error);
          this.errorMessage =
            error.error?.message ??
            `Unable to submit return request (HTTP ${error.status || 'network error'}).`;
          this.cdr.markForCheck();
        }
      });
  }

  goToInventory(): void {
    this.router.navigate(['/student/inventory']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onCoverImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = '/images/book-placeholder.svg';
  }
}

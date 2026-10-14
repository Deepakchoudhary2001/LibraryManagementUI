
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  AdminReturnRequest,
  LoanService
} from '../../services/loan.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-return-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-return-requests.html',
  styleUrl: './admin-return-requests.css'
})
export class AdminReturnRequests implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  requests: AdminReturnRequest[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  processingIds = new Set<number>();

  ngOnInit(): void {
    this.loadRequests();
  }


  get totalPendingFines(): number {
    return this.requests.reduce(
      (total, request) => total + (request.fineAmount ?? 0),
      0
    );
  }


  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.loanService.getPendingReturnRequests()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: requests => {
          this.requests = requests ?? [];
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Unable to load return requests:', error);
          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'Access denied. Please sign in using an admin account.'
              : error.status === 0
                ? 'Cannot connect to the library API. Check that the backend is running.'
                : `Unable to load return requests (HTTP ${error.status}).`;
          this.cdr.markForCheck();
        }
      });
  }

  confirmReturn(request: AdminReturnRequest): void {
    if (this.processingIds.has(request.id)) {
      return;
    }

    const fine = request.fineAmount ?? 0;
    const overdueDays = request.overdueDaysAtRequest ?? 0;

    const confirmed = confirm(
      `Confirm physical receipt of "${request.bookTitle}"?\n\n` +
      `Student: ${request.studentName}\n` +
      `Overdue days: ${overdueDays}\n` +
      `Fine recorded: ₹${fine.toFixed(2)}\n\n` +
      `This will close the loan and make the book available again.`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.processingIds.add(request.id);
    this.cdr.markForCheck();

    this.loanService.confirmReturn(request.id)
      .pipe(finalize(() => {
        this.processingIds.delete(request.id);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: response => {
          this.successMessage =
            response.message ||
            `Return confirmed for "${request.bookTitle}".`;
          this.requests = this.requests.filter(
            item => item.id !== request.id
          );
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Unable to confirm return:', error);
          this.errorMessage =
            error.error?.message ??
            `Unable to confirm return (HTTP ${error.status || 'network error'}).`;
          this.cdr.markForCheck();
        }
      });
  }

  goToInventory(): void {
    this.router.navigate(['/books']);
  }

  goToLoans(): void {
    this.router.navigate(['/admin/loans']);
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

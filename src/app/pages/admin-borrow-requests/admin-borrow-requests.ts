
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
  AdminBorrowRequest,
  BorrowRequestService
} from '../../services/borrow-request.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-borrow-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-borrow-requests.html',
  styleUrl: './admin-borrow-requests.css'
})
export class AdminBorrowRequests implements OnInit {
  private readonly requestService = inject(BorrowRequestService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  requests: AdminBorrowRequest[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  processingIds = new Set<number>();

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.requestService
      .getPendingRequests()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (requests) => {
          this.requests = requests ?? [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load pending requests:', error);

          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'Access denied. Please sign in using an admin account.'
              : error.status === 0
                ? 'Cannot connect to the API. Check that the backend is running.'
                : `Unable to load requests (HTTP ${error.status}).`;

          this.cdr.markForCheck();
        }
      });
  }

  approve(request: AdminBorrowRequest): void {
    if (this.processingIds.has(request.id)) {
      return;
    }

    if (
      request.book.availableCopies <= 0
    ) {
      this.errorMessage = `No copies of "${request.book.title}" are available.`;
      this.successMessage = '';
      return;
    }

    const confirmed = confirm(
      `Approve the request for "${request.book.title}" from ${request.student.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    this.processRequest(request.id, () =>
      this.requestService.approveRequest(request.id),
      `Request approved for ${request.student.fullName}.`
    );
  }

  reject(request: AdminBorrowRequest): void {
    if (this.processingIds.has(request.id)) {
      return;
    }

    const reason = prompt(
      `Enter a rejection reason for ${request.student.fullName} (optional):`
    );

    // Cancel means do not reject.
    if (reason === null) {
      return;
    }

    this.processRequest(request.id, () =>
      this.requestService.rejectRequest(request.id, reason.trim()),
      `Request rejected for ${request.student.fullName}.`
    );
  }

  private processRequest(
    id: number,
    action: () => import('rxjs').Observable<unknown>,
    successMessage: string
  ): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.processingIds.add(id);
    this.cdr.markForCheck();

    action()
      .pipe(
        finalize(() => {
          this.processingIds.delete(id);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = successMessage;
          this.requests = this.requests.filter(r => r.id !== id);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Unable to process borrow request:', error);

          this.errorMessage =
            error.error?.message ??
            (error.status === 409
              ? 'This book may no longer be available. Refresh the requests.'
              : `Unable to process request (HTTP ${error.status || 'network error'}).`);

          this.cdr.markForCheck();
        }
      });
  }

  goToInventory(): void {
    this.router.navigate(['/books']);
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


import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-loans.html',
  styleUrl: './admin-loans.css'
})
export class AdminLoans implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loans: any[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadLoans();
  }

  get activeLoans(): any[] {
    return this.loans.filter(loan => !loan.isReturned);
  }

  get returnedLoans(): any[] {
    return this.loans.filter(loan => loan.isReturned);
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

    this.loanService.getAllLoans()
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
          console.error('Unable to load loan history:', error);
          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'Access denied. Please sign in as an admin.'
              : `Unable to load loan history (HTTP ${error.status || 'network error'}).`;
          this.cdr.markForCheck();
        }
      });
  }

  goToReturnRequests(): void {
    this.router.navigate(['/admin/return-requests']);
  }

  goToInventory(): void {
    this.router.navigate(['/books']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviornment/enviornment';

export interface StudentLoan {
  id: number;
  bookId: number;
  bookTitle: string;
  author: string;
  coverImageUrl?: string | null;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  returnRequestedAt?: string | null;
  returnRequestStatus?: string | null;
  overdueDaysAtRequest?: number | null;
  fineAmount?: number | null;
  isReturned: boolean;
  isOverdue: boolean;
  estimatedOverdueDays: number;
  estimatedFineAmount: number;
}

export interface AdminReturnRequest {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string | null;
  borrowerId: number;
  studentName: string;
  studentEmail: string;
  studentMobile?: string | null;
  issueDate: string;
  dueDate: string;
  returnRequestedAt: string;
  overdueDaysAtRequest: number;
  fineAmount: number;
  returnRequestStatus: string;
}

export interface LoanActionResponse {
  message: string;
  id: number;
  bookId: number;
  borrowerId: number;
  returnDate?: string;
  returnRequestedAt?: string;
  returnRequestStatus?: string;
  overdueDaysAtRequest?: number;
  fineAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/loans`;

  getMyLoans(): Observable<StudentLoan[]> {
    return this.http.get<StudentLoan[]>(`${this.apiUrl}/my`);
  }

  requestReturn(loanId: number): Observable<LoanActionResponse> {
    return this.http.post<LoanActionResponse>(
      `${this.apiUrl}/${loanId}/request-return`,
      {}
    );
  }

  getPendingReturnRequests(): Observable<AdminReturnRequest[]> {
    return this.http.get<AdminReturnRequest[]>(
      `${this.apiUrl}/return-requests`
    );
  }

  confirmReturn(loanId: number): Observable<LoanActionResponse> {
    return this.http.post<LoanActionResponse>(
      `${this.apiUrl}/${loanId}/confirm-return`,
      {}
    );
  }

  // Existing admin endpoint for viewing active and returned loans.
  getAllLoans(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}

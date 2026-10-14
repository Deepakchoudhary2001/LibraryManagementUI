
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviornment/enviornment';

export type BorrowRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CreateBorrowRequest {
  bookId: number;
}

export interface BorrowRequest {
  id: number;
  bookId: number;
  title?: string;
  bookTitle?: string;
  coverImageUrl?: string;
  requestedAt: string;
  status: BorrowRequestStatus;
  rejectionReason?: string | null;
  loanId?: number | null;
}

export interface AdminBorrowRequest {
  id: number;
  requestedAt: string;
  status: BorrowRequestStatus;
  book: {
    id: number;
    title: string;
    author: string;
    coverImageUrl?: string | null;
    totalCopies: number;
    availableCopies: number;
  };
  student: {
    id: number;
    fullName: string;
    email: string;
    mobileNumber: string;
  };
}

@Injectable({ providedIn: 'root' })
export class BorrowRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/borrowrequests`;

  // Student endpoints
  createRequest(bookId: number): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, {
      bookId
    } satisfies CreateBorrowRequest);
  }

  getMyRequests(): Observable<BorrowRequest[]> {
    return this.http.get<BorrowRequest[]>(`${this.apiUrl}/my`);
  }

  // Admin endpoints
  getPendingRequests(): Observable<AdminBorrowRequest[]> {
    return this.http.get<AdminBorrowRequest[]>(
      `${this.apiUrl}/pending`
    );
  }

  approveRequest(id: number): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.apiUrl}/${id}/approve`,
      {}
    );
  }

  rejectRequest(id: number, reason: string): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.apiUrl}/${id}/reject`,
      { reason }
    );
  }
}

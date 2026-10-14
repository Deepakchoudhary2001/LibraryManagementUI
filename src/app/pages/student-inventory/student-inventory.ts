
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { BookService } from '../../services/book.service';
import {
  BorrowRequest,
  BorrowRequestService
} from '../../services/borrow-request.service';
import { Book, BookPage } from '../../models/book.model';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-student-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-inventory.html',
  styleUrl: './student-inventory.css'
})
export class StudentInventory implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly requestService = inject(BorrowRequestService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  books: Book[] = [];
  myRequests: BorrowRequest[] = [];

  searchText = '';
  currentPage = 1;
  pageSize = 8;
  totalCount = 0;

  loading = false;
  requestsLoading = false;

  errorMessage = '';
  successMessage = '';

  requestingBookIds = new Set<number>();
  pendingBookIds = new Set<number>();

  ngOnInit(): void {
    this.loadBooks();
    this.loadMyRequests();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get firstItemNumber(): number {
    return this.totalCount === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastItemNumber(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  loadBooks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.bookService
      .getBooks(this.searchText, this.currentPage, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: BookPage) => {
          if (!response || !Array.isArray(response.items)) {
            this.books = [];
            this.totalCount = 0;
            this.errorMessage = 'The API returned an unexpected book list.';
            this.cdr.markForCheck();
            return;
          }

          this.books = response.items;
          this.totalCount = response.totalCount ?? 0;
          this.currentPage = response.page ?? this.currentPage;
          this.pageSize = response.pageSize ?? this.pageSize;

          if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
            this.loadBooks();
            return;
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Unable to load student inventory:', error);
          this.books = [];
          this.totalCount = 0;
          this.errorMessage =
            error.status === 0
              ? 'Cannot connect to the library API. Check that the backend is running.'
              : `Unable to load books (HTTP ${error.status}).`;
          this.cdr.markForCheck();
        }
      });
  }

  loadMyRequests(): void {
    this.requestsLoading = true;

    this.requestService
      .getMyRequests()
      .pipe(
        finalize(() => {
          this.requestsLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (requests) => {
          this.myRequests = requests ?? [];
          this.pendingBookIds = new Set(
            this.myRequests
              .filter(request => request.status === 'Pending')
              .map(request => request.bookId)
          );
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Unable to load my borrow requests:', error);
          // Inventory can still be used if request history fails to load.
          this.cdr.markForCheck();
        }
      });
  }

  searchBooks(): void {
    this.currentPage = 1;
    this.loadBooks();
  }

  clearSearch(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.loadBooks();
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage ||
      this.loading
    ) {
      return;
    }

    this.currentPage = page;
    this.loadBooks();
  }

  requestToBorrow(book: Book): void {
    if (this.requestingBookIds.has(book.id)) {
      return;
    }

    if (this.pendingBookIds.has(book.id)) {
      this.showError('You already have a pending request for this book.');
      return;
    }

    if (book.availableCopies <= 0) {
      this.showError('No copies of this book are currently available.');
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.requestingBookIds.add(book.id);
    this.cdr.markForCheck();

    this.requestService
      .createRequest(book.id)
      .pipe(
        finalize(() => {
          this.requestingBookIds.delete(book.id);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.pendingBookIds.add(book.id);
          this.showSuccess(`Borrow request submitted for "${book.title}".`);
          this.loadMyRequests();
        },
        error: (error) => {
          console.error('Borrow request failed:', error);

          if (error.status === 409) {
            this.showError(
              error.error?.message ??
              'A request or active loan already exists for this book.'
            );
          } else if (error.status === 401 || error.status === 403) {
            this.showError(
              'Your student session may have expired. Please sign in again.'
            );
          } else {
            this.showError(
              error.error?.message ??
              `Unable to submit the request (HTTP ${error.status || 'network error'}).`
            );
          }
        }
      });
  }

  getRequestStatus(bookId: number): string | null {
    const request = this.myRequests.find(
      item => item.bookId === bookId
    );

    return request?.status ?? null;
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  onCoverImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = '/images/book-placeholder.svg';
  }
  goToMyLoans(): void {
    this.router.navigate(['/student/loans']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

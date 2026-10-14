
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { finalize } from 'rxjs';

import { BookService } from '../../services/book.service';
import { Book, BookForm, BookPage } from '../../models/book.model';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './books.html',
  styleUrl: './books.css'
})
export class BooksComponent implements OnInit, OnDestroy {
  private readonly bookService = inject(BookService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  books: Book[] = [];

  searchText = '';
  currentPage = 1;
  pageSize = 8;
  totalCount = 0;

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;
  editingBookId: number | null = null;

  form: BookForm = this.emptyForm();

  private messageTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadBooks();
  }

  ngOnDestroy(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
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

  private notifyView(): void {
    // Important for zoneless Angular applications.
    this.cdr.markForCheck();
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.scheduleMessageClear();
    this.notifyView();
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.scheduleMessageClear();
    this.notifyView();
  }

  private scheduleMessageClear(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    this.messageTimer = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.messageTimer = undefined;
      this.notifyView();
    }, 4000);
  }

  loadBooks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.notifyView();

    this.bookService
      .getBooks(this.searchText, this.currentPage, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.notifyView();
        })
      )
      .subscribe({
        next: (response: BookPage) => {
          console.log('Books API response:', response);

          if (!response || !Array.isArray(response.items)) {
            this.books = [];
            this.totalCount = 0;
            this.showError(
              'Unexpected API response. Check the browser console.'
            );
            console.error('Unexpected books response:', response);
            return;
          }

          this.books = response.items;
          this.totalCount = response.totalCount ?? 0;
          this.currentPage = response.page ?? this.currentPage;
          this.pageSize = response.pageSize ?? this.pageSize;

          // If the current page no longer exists, return to page 1.
          if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
            this.loadBooks();
            return;
          }

          this.notifyView();
        },
        error: (error) => {
          console.error('Failed to load books:', error);

          this.books = [];
          this.totalCount = 0;

          this.showError(
            error.status === 0
              ? 'Cannot connect to the API. Check that the backend is running and the API URL is correct.'
              : `Unable to load books (HTTP ${error.status}). Check the Network tab and backend logs.`
          );
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

  openAddForm(): void {
    this.editingBookId = null;
    this.form = this.emptyForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
    this.notifyView();
  }

  openEditForm(book: Book): void {
    this.editingBookId = book.id;

    this.form = {
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? '',
      description: book.description ?? '',
      category: book.category ?? '',
      coverImageUrl: book.coverImageUrl ?? '',
      publishedYear: book.publishedYear,
      totalCopies: book.totalCopies
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
    this.notifyView();
  }

  closeForm(): void {
    if (this.saving) {
      return;
    }

    this.showForm = false;
    this.editingBookId = null;
    this.errorMessage = '';
    this.notifyView();
  }

  saveBook(): void {
    const isEditing = this.editingBookId !== null;
    const bookId = this.editingBookId;

    const payload: BookForm = {
      ...this.form,
      title: (this.form.title ?? '').trim(),
      author: (this.form.author ?? '').trim(),
      isbn: (this.form.isbn ?? '').trim(),
      description: (this.form.description ?? '').trim(),
      category: (this.form.category ?? '').trim(),
      coverImageUrl: (this.form.coverImageUrl ?? '').trim()
    };

    if (!payload.title || !payload.author) {
      this.showError('Title and author are required.');
      return;
    }

    if (
      !Number.isInteger(payload.totalCopies) ||
      payload.totalCopies < 1 ||
      payload.totalCopies > 10000
    ) {
      this.showError('Total copies must be between 1 and 10000.');
      return;
    }

    if (
      payload.publishedYear !== null &&
      payload.publishedYear !== undefined &&
      (
        !Number.isInteger(payload.publishedYear) ||
        payload.publishedYear < 1 ||
        payload.publishedYear > 9999
      )
    ) {
      this.showError('Enter a valid published year.');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.notifyView();

    const request = isEditing
      ? this.bookService.updateBook(bookId!, payload)
      : this.bookService.createBook(payload);

    request
      .pipe(
        finalize(() => {
          this.saving = false;
          this.notifyView();
        })
      )
      .subscribe({
        next: () => {
          this.showForm = false;
          this.editingBookId = null;

          if (!isEditing) {
            this.currentPage = 1;
            this.searchText = '';
          }

          this.showSuccess(
            isEditing
              ? 'Book updated successfully.'
              : 'Book added successfully.'
          );

          this.loadBooks();
          this.notifyView();
        },
        error: (error) => {
          console.error('Save book error:', error);

          const message =
            error.error?.message ??
            (error.status === 409
              ? 'The book could not be saved. Check whether the ISBN already exists.'
              : error.status === 400
                ? 'The API rejected the book details. Check the validation errors.'
                : `Unable to save the book (HTTP ${error.status || 'network error'}).`);

          this.showError(message);
        }
      });
  }

  deleteBook(book: Book): void {
    if (this.loading) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.bookService
      .deleteBook(book.id)
      .pipe(
        finalize(() => this.notifyView())
      )
      .subscribe({
        next: () => {
          if (this.books.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }

          this.showSuccess('Book deleted successfully.');
          this.loadBooks();
          this.notifyView();
        },
        error: (error) => {
          console.error('Delete book error:', error);

          const message =
            error.error?.message ??
            (error.status === 409
              ? 'This book has loan history and cannot be deleted.'
              : `Unable to delete the book (HTTP ${error.status || 'network error'}).`);

          this.showError(message);
        }
      });
  }

  onCoverImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = '/images/book-placeholder.svg';
  }
  openReturnRequests(): void {
    this.router.navigate(['/admin/return-requests']);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  openBorrowRequests(): void {
    this.router.navigate(['/admin/borrow-requests']);
  }

  private emptyForm(): BookForm {
    return {
      title: '',
      author: '',
      isbn: '',
      description: '',
      category: '',
      coverImageUrl: '',
      publishedYear: null,
      totalCopies: 1
    };
  }
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  category: string | null;
  coverImageUrl: string | null;
  publishedYear: number | null;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
}

export interface BookForm {
  title: string;
  author: string;
  isbn: string;
  description: string;
  category: string;
  coverImageUrl: string;
  publishedYear: number | null;
  totalCopies: number;
}

export interface BookPage {
  page: number;
  pageSize: number;
  totalCount: number;
  items: Book[];
}
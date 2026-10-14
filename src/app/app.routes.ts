
import { Routes } from '@angular/router';
import { StudentLoans } from './pages/student-loans/student-loans';
import { AdminReturnRequests } from './pages/admin-return-requests/admin-return-requests';
import { AdminLoans } from './pages/admin-loans/admin-loans';
import { HomeComponent } from './pages/home/home';
import { BooksComponent } from './pages/books/books';
import { LoginComponent } from './pages/login/login';
import { StudentLoginComponent } from './pages/student-login/student-login';
import { AdminBorrowRequests } from './pages/admin-borrow-requests/admin-borrow-requests';
import { StudentInventory } from './pages/student-inventory/student-inventory';

import { roleGuard } from './guards/role-guard-guard';
import { StudentRegisterComponent } from './pages/student-register/student-register';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'login/student',
    component: StudentLoginComponent
  },
  {
    path: 'register',
    component: StudentRegisterComponent
  },
  {
    path: 'books',
    component: BooksComponent,
    canActivate: [roleGuard('Admin')]
  },
  {
    path: 'student/inventory',
    component: StudentInventory,
    canActivate: [roleGuard('Student')]
  },
  {
    path: 'admin/borrow-requests',
    component: AdminBorrowRequests,
    canActivate: [roleGuard('Admin')]
  },
  {
    path: 'student/loans',
    component: StudentLoans,
    canActivate: [roleGuard('Student')]
  },
  {
    path: 'admin/return-requests',
    component: AdminReturnRequests,
    canActivate: [roleGuard('Admin')]
  },
  {
    path: 'admin/loans',
    component: AdminLoans,
    canActivate: [roleGuard('Admin')]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

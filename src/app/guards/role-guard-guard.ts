
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth';

export function roleGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree([
        requiredRole === 'Student' ? '/login/student' : '/login'
      ]);
    }

    if (auth.getRole() !== requiredRole) {
      const correctHome =
        auth.getRole() === 'Student'
          ? '/student/inventory'
          : '/books';

      return router.createUrlTree([correctHome]);
    }

    return true;
  };
}

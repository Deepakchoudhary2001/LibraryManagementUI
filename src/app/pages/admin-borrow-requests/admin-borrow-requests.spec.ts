import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBorrowRequests } from './admin-borrow-requests';

describe('AdminBorrowRequests', () => {
  let component: AdminBorrowRequests;
  let fixture: ComponentFixture<AdminBorrowRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBorrowRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBorrowRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

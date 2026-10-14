import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReturnRequests } from './admin-return-requests';

describe('AdminReturnRequests', () => {
  let component: AdminReturnRequests;
  let fixture: ComponentFixture<AdminReturnRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReturnRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReturnRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

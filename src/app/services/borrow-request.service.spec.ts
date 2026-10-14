import { TestBed } from '@angular/core/testing';

import { BorrowRequestService } from './borrow-request.service';

describe('BorrowRequestService', () => {
  let service: BorrowRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BorrowRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

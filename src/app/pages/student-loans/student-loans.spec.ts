import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentLoans } from './student-loans';

describe('StudentLoans', () => {
  let component: StudentLoans;
  let fixture: ComponentFixture<StudentLoans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentLoans],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentLoans);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

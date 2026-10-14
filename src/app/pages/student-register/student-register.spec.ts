import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentRegister } from './student-register';

describe('StudentRegister', () => {
  let component: StudentRegister;
  let fixture: ComponentFixture<StudentRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentRegister);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

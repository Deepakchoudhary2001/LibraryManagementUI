import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentInventory } from './student-inventory';

describe('StudentInventory', () => {
  let component: StudentInventory;
  let fixture: ComponentFixture<StudentInventory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentInventory],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentInventory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

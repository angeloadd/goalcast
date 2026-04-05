import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {RadioGroupComponent, RadioGroupItemComponent} from './radio-group.component';

@Component({
  template: `
    <fb-radio-group [formControl]="ctrl">
      <fb-radio-group-item value="a">Option A</fb-radio-group-item>
      <fb-radio-group-item value="b">Option B</fb-radio-group-item>
      <fb-radio-group-item value="c">Option C</fb-radio-group-item>
    </fb-radio-group>
  `,
  imports: [RadioGroupComponent, RadioGroupItemComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl('a');
}

describe('RadioGroupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render all radio items', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('fb-radio-group-item');
    expect(items.length).toBe(3);
  });

  it('should select initial value from formControl', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);
  });

  it('should update formControl when item is clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    inputs[1].click();
    expect(fixture.componentInstance.ctrl.value).toBe('b');
  });
});

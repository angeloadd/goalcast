import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {SelectComponent, SelectItemComponent} from './select.component';

@Component({
  template: `
    <fb-select [formControl]="ctrl" placeholder="Choose...">
      <fb-select-item value="a">Alpha</fb-select-item>
      <fb-select-item value="b">Beta</fb-select-item>
      <fb-select-item value="c">Gamma</fb-select-item>
    </fb-select>
  `,
  imports: [SelectComponent, SelectItemComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl('');
}

describe('SelectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should show placeholder when no value selected', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-trigger]') as HTMLElement;
    expect(trigger.textContent).toContain('Choose...');
  });

  it('should open dropdown on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-trigger]') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const dropdown = fixture.nativeElement.querySelector('[data-content]') as HTMLElement;
    expect(dropdown).toBeTruthy();
    expect(dropdown.classList.contains('hidden')).toBe(false);
  });

  it('should select item and close dropdown', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-trigger]') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('fb-select-item') as NodeListOf<HTMLElement>;
    items[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBe('b');
    expect(trigger.textContent).toContain('Beta');
  });
});

import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {AlertComponent, AlertTitleComponent, AlertDescriptionComponent} from './alert.component';

@Component({
  template: `
    <fb-alert variant="destructive">
      <fb-alert-title>Error</fb-alert-title>
      <fb-alert-description>Something went wrong.</fb-alert-description>
    </fb-alert>
  `,
  imports: [AlertComponent, AlertTitleComponent, AlertDescriptionComponent],
})
class TestHostComponent {}

describe('AlertComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [TestHostComponent]}).compileComponents();
  });

  it('should render title and description', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fb-alert-title')?.textContent).toContain('Error');
    expect(el.querySelector('fb-alert-description')?.textContent).toContain('Something went wrong.');
  });

  it('should apply destructive variant styling', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('fb-alert') as HTMLElement;
    expect(alert.classList.contains('border-destructive')).toBe(true);
  });
});

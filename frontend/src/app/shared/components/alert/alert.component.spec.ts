import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AlertComponent, AlertDescriptionComponent, AlertTitleComponent } from './alert.component';

@Component({
    template: `
        <gc-alert variant="destructive">
            <gc-alert-title>Error</gc-alert-title>
            <gc-alert-description>Something went wrong.</gc-alert-description>
        </gc-alert>
    `,
    imports: [AlertComponent, AlertTitleComponent, AlertDescriptionComponent],
})
class TestHostComponent {}

describe('AlertComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should render title and description', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('gc-alert-title')?.textContent).toContain('Error');
        expect(el.querySelector('gc-alert-description')?.textContent).toContain(
            'Something went wrong.',
        );
    });

    it('should apply destructive variant styling', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const alert = fixture.nativeElement.querySelector('gc-alert') as HTMLElement;
        expect(alert.classList.contains('border-destructive')).toBe(true);
    });
});

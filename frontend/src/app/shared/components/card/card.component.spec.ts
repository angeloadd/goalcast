import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    CardComponent,
    CardContentComponent,
    CardDescriptionComponent,
    CardFooterComponent,
    CardHeaderComponent,
    CardTitleComponent,
} from './card.component';

@Component({
    template: `
        <fb-card>
            <fb-card-header>
                <fb-card-title>Test Title</fb-card-title>
                <fb-card-description>Test Description</fb-card-description>
            </fb-card-header>
            <fb-card-content>Body content</fb-card-content>
            <fb-card-footer>Footer content</fb-card-footer>
        </fb-card>
    `,
    imports: [
        CardComponent,
        CardHeaderComponent,
        CardTitleComponent,
        CardDescriptionComponent,
        CardContentComponent,
        CardFooterComponent,
    ],
})
class TestHostComponent {}

describe('CardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render card with all sub-components', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('fb-card')).toBeTruthy();
        expect(el.querySelector('fb-card-title')?.textContent).toContain('Test Title');
        expect(el.querySelector('fb-card-description')?.textContent).toContain('Test Description');
        expect(el.querySelector('fb-card-content')?.textContent).toContain('Body content');
        expect(el.querySelector('fb-card-footer')?.textContent).toContain('Footer content');
    });

    it('should apply card styling classes', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const card = fixture.nativeElement.querySelector('fb-card') as HTMLElement;
        expect(card.classList.contains('bg-card')).toBe(true);
    });
});

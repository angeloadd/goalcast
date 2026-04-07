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
        <gc-card>
            <gc-card-header>
                <gc-card-title>Test Title</gc-card-title>
                <gc-card-description>Test Description</gc-card-description>
            </gc-card-header>
            <gc-card-content>Body content</gc-card-content>
            <gc-card-footer>Footer content</gc-card-footer>
        </gc-card>
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
        expect(el.querySelector('gc-card')).toBeTruthy();
        expect(el.querySelector('gc-card-title')?.textContent).toContain('Test Title');
        expect(el.querySelector('gc-card-description')?.textContent).toContain('Test Description');
        expect(el.querySelector('gc-card-content')?.textContent).toContain('Body content');
        expect(el.querySelector('gc-card-footer')?.textContent).toContain('Footer content');
    });

    it('should apply card styling classes', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const card = fixture.nativeElement.querySelector('gc-card') as HTMLElement;
        expect(card.classList.contains('bg-card')).toBe(true);
    });
});

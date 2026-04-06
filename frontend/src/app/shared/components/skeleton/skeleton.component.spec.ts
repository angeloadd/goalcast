import { TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    });

    it('should render with animate-pulse class', () => {
        const fixture = TestBed.createComponent(SkeletonComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement.querySelector('[data-skeleton]') as HTMLElement;
        expect(el.classList.contains('animate-pulse')).toBe(true);
    });

    it('should accept custom class for sizing', () => {
        const fixture = TestBed.createComponent(SkeletonComponent);
        fixture.componentRef.setInput('class', 'h-4 w-32');
        fixture.detectChanges();
        const el = fixture.nativeElement.querySelector('[data-skeleton]') as HTMLElement;
        expect(el.className).toContain('h-4');
    });
});

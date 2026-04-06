import { TestBed } from '@angular/core/testing';
import { ProgressComponent } from './progress.component';

describe('ProgressComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProgressComponent],
        }).compileComponents();
    });

    it('should render with correct width percentage', () => {
        const fixture = TestBed.createComponent(ProgressComponent);
        fixture.componentRef.setInput('value', 75);
        fixture.detectChanges();
        const fill = fixture.nativeElement.querySelector('[data-fill]') as HTMLElement;
        expect(fill.style.width).toBe('75%');
    });

    it('should clamp value between 0 and 100', () => {
        const fixture = TestBed.createComponent(ProgressComponent);
        fixture.componentRef.setInput('value', 150);
        fixture.detectChanges();
        const fill = fixture.nativeElement.querySelector('[data-fill]') as HTMLElement;
        expect(fill.style.width).toBe('100%');
    });

    it('should default to 0', () => {
        const fixture = TestBed.createComponent(ProgressComponent);
        fixture.detectChanges();
        const fill = fixture.nativeElement.querySelector('[data-fill]') as HTMLElement;
        expect(fill.style.width).toBe('0%');
    });
});

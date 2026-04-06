import { TestBed } from '@angular/core/testing';
import { ScrollAreaComponent } from '@fb/shared/components';

describe('ScrollAreaComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ScrollAreaComponent],
        }).compileComponents();
    });

    it('should render with overflow auto', () => {
        const fixture = TestBed.createComponent(ScrollAreaComponent);
        fixture.detectChanges();
        const container = fixture.nativeElement.querySelector('[data-scroll-area]') as HTMLElement;
        expect(container).toBeTruthy();
    });
});

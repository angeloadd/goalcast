import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HoverCardComponent, HoverCardContentComponent, HoverCardTriggerComponent } from '@fb/shared/components';

@Component({
    template: `
        <fb-hover-card>
            <fb-hover-card-trigger><span>Hover me</span></fb-hover-card-trigger>
            <fb-hover-card-content>Rich card content</fb-hover-card-content>
        </fb-hover-card>
    `,
    imports: [HoverCardComponent, HoverCardTriggerComponent, HoverCardContentComponent],
})
class TestHostComponent {
}

describe('HoverCardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should hide content by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-hover-card-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content on mouseenter after delay', async () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        vi.useFakeTimers();
        const trigger = fixture.nativeElement.querySelector('fb-hover-card-trigger') as HTMLElement;
        trigger.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(200);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-hover-card-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
        vi.useRealTimers();
    });

    it('should hide content on mouseleave', async () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        vi.useFakeTimers();
        const trigger = fixture.nativeElement.querySelector('fb-hover-card-trigger') as HTMLElement;
        trigger.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(200);
        fixture.detectChanges();
        trigger.dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(100);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-hover-card-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
        vi.useRealTimers();
    });
});

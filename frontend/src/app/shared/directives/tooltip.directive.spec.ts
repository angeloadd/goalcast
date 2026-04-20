import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
    template: ` <button gcTooltip="Help text">Hover me</button>`,
    imports: [TooltipDirective],
})
class TestHostComponent {}

describe('TooltipDirective', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should not show tooltip initially', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const tooltip = fixture.nativeElement.querySelector('[data-tooltip]');
        expect(tooltip).toBeNull();
    });

    it('should show tooltip on mouseenter', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const button = fixture.nativeElement.querySelector('button') as HTMLElement;
        button.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
        const tooltip = fixture.nativeElement.querySelector('[data-tooltip]') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toContain('Help text');
    });

    it('should hide tooltip on mouseleave', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const button = fixture.nativeElement.querySelector('button') as HTMLElement;
        button.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
        button.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();
        const tooltip = fixture.nativeElement.querySelector('[data-tooltip]');
        expect(tooltip).toBeNull();
    });
});

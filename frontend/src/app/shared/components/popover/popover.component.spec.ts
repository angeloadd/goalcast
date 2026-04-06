import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    PopoverComponent,
    PopoverContentComponent,
    PopoverTriggerComponent,
} from './popover.component';

@Component({
    template: `
        <fb-popover>
            <fb-popover-trigger>
                <button>Open</button>
            </fb-popover-trigger>
            <fb-popover-content>Popover content</fb-popover-content>
        </fb-popover>
    `,
    imports: [PopoverComponent, PopoverTriggerComponent, PopoverContentComponent],
})
class TestHostComponent {}

describe('PopoverComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should hide content by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-popover-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-popover-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-popover-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should hide content on second trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-popover-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-popover-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});

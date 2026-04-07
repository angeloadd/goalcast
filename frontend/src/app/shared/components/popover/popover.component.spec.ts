import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    PopoverComponent,
    PopoverContentComponent,
    PopoverTriggerComponent,
} from './popover.component';

@Component({
    template: `
        <gc-popover>
            <gc-popover-trigger>
                <button>Open</button>
            </gc-popover-trigger>
            <gc-popover-content>Popover content</gc-popover-content>
        </gc-popover>
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
        const content = fixture.nativeElement.querySelector('gc-popover-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('gc-popover-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('gc-popover-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should hide content on second trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('gc-popover-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('gc-popover-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});

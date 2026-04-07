import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    CollapsibleComponent,
    CollapsibleContentComponent,
    CollapsibleTriggerComponent,
} from '@fb/shared/components';

@Component({
    template: `
        <gc-collapsible [(open)]="isOpen">
            <gc-collapsible-trigger>
                <button>Toggle</button>
            </gc-collapsible-trigger>
            <gc-collapsible-content>Hidden content</gc-collapsible-content>
        </gc-collapsible>
    `,
    imports: [CollapsibleComponent, CollapsibleTriggerComponent, CollapsibleContentComponent],
})
class TestHostComponent {
    isOpen = false;
}

describe('CollapsibleComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should hide content when closed', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-collapsible-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content when open', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.isOpen = true;
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-collapsible-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should toggle on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'gc-collapsible-trigger',
        ) as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.isOpen).toBe(true);
        const content = fixture.nativeElement.querySelector(
            'gc-collapsible-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });
});

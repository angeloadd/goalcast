import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    CollapsibleComponent,
    CollapsibleContentComponent,
    CollapsibleTriggerComponent,
} from './collapsible.component';

@Component({
    template: `
        <fb-collapsible [(open)]="isOpen">
            <fb-collapsible-trigger>
                <button>Toggle</button>
            </fb-collapsible-trigger>
            <fb-collapsible-content>Hidden content</fb-collapsible-content>
        </fb-collapsible>
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
            'fb-collapsible-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content when open', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.isOpen = true;
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'fb-collapsible-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should toggle on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'fb-collapsible-trigger',
        ) as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.isOpen).toBe(true);
        const content = fixture.nativeElement.querySelector(
            'fb-collapsible-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });
});

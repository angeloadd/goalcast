import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    AccordionComponent,
    AccordionContentComponent,
    AccordionItemComponent,
    AccordionTriggerComponent,
} from './accordion.component';

@Component({
    template: `
        <gc-accordion type="single">
            <gc-accordion-item value="item1">
                <gc-accordion-trigger>Section 1</gc-accordion-trigger>
                <gc-accordion-content>Content 1</gc-accordion-content>
            </gc-accordion-item>
            <gc-accordion-item value="item2">
                <gc-accordion-trigger>Section 2</gc-accordion-trigger>
                <gc-accordion-content>Content 2</gc-accordion-content>
            </gc-accordion-item>
        </gc-accordion>
    `,
    imports: [
        AccordionComponent,
        AccordionItemComponent,
        AccordionTriggerComponent,
        AccordionContentComponent,
    ],
})
class TestHostComponent {}

describe('AccordionComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should render all items collapsed by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'gc-accordion-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should expand item on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'gc-accordion-trigger',
        ) as NodeListOf<HTMLElement>;
        triggers[0].click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'gc-accordion-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(false);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should collapse previous item in single mode', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'gc-accordion-trigger',
        ) as NodeListOf<HTMLElement>;
        triggers[0].click();
        fixture.detectChanges();
        triggers[1].click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'gc-accordion-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(false);
    });
});

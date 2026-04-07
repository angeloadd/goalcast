import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    TabsComponent,
    TabsContentComponent,
    TabsListComponent,
    TabsTriggerComponent,
} from './tabs.component';

@Component({
    template: `
        <gc-tabs value="tab1">
            <gc-tabs-list>
                <gc-tabs-trigger value="tab1">Tab 1</gc-tabs-trigger>
                <gc-tabs-trigger value="tab2">Tab 2</gc-tabs-trigger>
            </gc-tabs-list>
            <gc-tabs-content value="tab1">Content 1</gc-tabs-content>
            <gc-tabs-content value="tab2">Content 2</gc-tabs-content>
        </gc-tabs>
    `,
    imports: [TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent],
})
class TestHostComponent {}

describe('TabsComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should show active tab content and hide inactive', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const contents = el.querySelectorAll('gc-tabs-content');
        expect(contents[0].classList.contains('hidden')).toBe(false);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should switch tabs on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'gc-tabs-trigger',
        ) as NodeListOf<HTMLElement>;
        triggers[1].click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll('gc-tabs-content');
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(false);
    });

    it('should mark active trigger', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'gc-tabs-trigger',
        ) as NodeListOf<HTMLElement>;
        expect(triggers[0].getAttribute('data-state')).toBe('active');
        expect(triggers[1].getAttribute('data-state')).toBe('inactive');
    });
});

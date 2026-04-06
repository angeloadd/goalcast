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
        <fb-tabs value="tab1">
            <fb-tabs-list>
                <fb-tabs-trigger value="tab1">Tab 1</fb-tabs-trigger>
                <fb-tabs-trigger value="tab2">Tab 2</fb-tabs-trigger>
            </fb-tabs-list>
            <fb-tabs-content value="tab1">Content 1</fb-tabs-content>
            <fb-tabs-content value="tab2">Content 2</fb-tabs-content>
        </fb-tabs>
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
        const contents = el.querySelectorAll('fb-tabs-content');
        expect(contents[0].classList.contains('hidden')).toBe(false);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should switch tabs on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'fb-tabs-trigger',
        ) as NodeListOf<HTMLElement>;
        triggers[1].click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll('fb-tabs-content');
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(false);
    });

    it('should mark active trigger', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'fb-tabs-trigger',
        ) as NodeListOf<HTMLElement>;
        expect(triggers[0].getAttribute('data-state')).toBe('active');
        expect(triggers[1].getAttribute('data-state')).toBe('inactive');
    });
});

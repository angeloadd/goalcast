import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    NavigationMenuComponent,
    NavigationMenuContentComponent,
    NavigationMenuItemComponent,
    NavigationMenuLinkComponent,
    NavigationMenuTriggerComponent,
} from '@fb/shared/components';

@Component({
    template: `
        <gc-navigation-menu>
            <gc-navigation-menu-item>
                <gc-navigation-menu-trigger>Features</gc-navigation-menu-trigger>
                <gc-navigation-menu-content>
                    <gc-navigation-menu-link>Predictions</gc-navigation-menu-link>
                    <gc-navigation-menu-link>Leagues</gc-navigation-menu-link>
                </gc-navigation-menu-content>
            </gc-navigation-menu-item>
            <gc-navigation-menu-item>
                <gc-navigation-menu-link>Pricing</gc-navigation-menu-link>
            </gc-navigation-menu-item>
        </gc-navigation-menu>
    `,
    imports: [
        NavigationMenuComponent,
        NavigationMenuItemComponent,
        NavigationMenuTriggerComponent,
        NavigationMenuContentComponent,
        NavigationMenuLinkComponent,
    ],
})
class TestHostComponent {}

describe('NavigationMenuComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should render all menu items', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const items = fixture.nativeElement.querySelectorAll(
            'gc-navigation-menu-item',
        ) as NodeListOf<HTMLElement>;
        expect(items.length).toBe(2);
    });

    it('should hide content by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-navigation-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'gc-navigation-menu-trigger',
        ) as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-navigation-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });
});

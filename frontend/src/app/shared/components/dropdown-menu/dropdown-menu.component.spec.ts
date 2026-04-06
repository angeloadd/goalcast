import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    DropdownMenuComponent,
    DropdownMenuContentComponent,
    DropdownMenuItemComponent,
    DropdownMenuSeparatorComponent,
    DropdownMenuTriggerComponent,
} from '@fb/shared/components';

@Component({
    template: `
        <fb-dropdown-menu>
            <fb-dropdown-menu-trigger>
                <button>Menu</button>
            </fb-dropdown-menu-trigger>
            <fb-dropdown-menu-content>
                <fb-dropdown-menu-item>Profile</fb-dropdown-menu-item>
                <fb-dropdown-menu-separator></fb-dropdown-menu-separator>
                <fb-dropdown-menu-item>Logout</fb-dropdown-menu-item>
            </fb-dropdown-menu-content>
        </fb-dropdown-menu>
    `,
    imports: [
        DropdownMenuComponent,
        DropdownMenuTriggerComponent,
        DropdownMenuContentComponent,
        DropdownMenuItemComponent,
        DropdownMenuSeparatorComponent,
    ],
})
class TestHostComponent {
}

describe('DropdownMenuComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should hide menu by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'fb-dropdown-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show menu on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'fb-dropdown-menu-trigger',
        ) as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'fb-dropdown-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should render menu items and separator', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'fb-dropdown-menu-trigger',
        ) as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Profile');
        expect(el.textContent).toContain('Logout');
        expect(el.querySelector('fb-dropdown-menu-separator')).toBeTruthy();
    });
});

import { Component, inject, InjectionToken, signal } from '@angular/core';

export class NavMenuItemContext {
    isOpen = signal(false);

    toggle(): void {
        this.isOpen.update((v) => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

const NAV_MENU_ITEM_CONTEXT = new InjectionToken<NavMenuItemContext>('NavMenuItemContext');

@Component({
    selector: 'fb-navigation-menu',
    host: { class: 'relative flex items-center gap-1' },
    template: '<ng-content />',
})
export class NavigationMenuComponent {}

@Component({
    selector: 'fb-navigation-menu-item',
    host: { class: 'relative' },
    template: '<ng-content />',
    providers: [{ provide: NAV_MENU_ITEM_CONTEXT, useFactory: () => new NavMenuItemContext() }],
})
export class NavigationMenuItemComponent {}

@Component({
    selector: 'fb-navigation-menu-trigger',
    host: {
        class: 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/10 cursor-pointer',
        '(click)': 'context.toggle()',
    },
    template: '<ng-content />',
})
export class NavigationMenuTriggerComponent {
    context = inject(NAV_MENU_ITEM_CONTEXT);
}

@Component({
    selector: 'fb-navigation-menu-content',
    host: {
        class: 'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-lg',
        '[class.hidden]': '!context.isOpen()',
    },
    template: '<ng-content />',
})
export class NavigationMenuContentComponent {
    context = inject(NAV_MENU_ITEM_CONTEXT);
}

@Component({
    selector: 'fb-navigation-menu-link',
    host: {
        class: 'block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent/10 cursor-pointer',
    },
    template: '<ng-content />',
})
export class NavigationMenuLinkComponent {}

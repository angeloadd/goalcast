import { Component, inject, InjectionToken, signal } from '@angular/core';

export class DropdownContext {
    isOpen = signal(false);

    toggle(): void {
        this.isOpen.update((v) => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

const DROPDOWN_CONTEXT = new InjectionToken<DropdownContext>('DropdownContext');

@Component({
    selector: 'fb-dropdown-menu',
    host: { class: 'relative inline-block' },
    template: '<ng-content />',
    providers: [{ provide: DROPDOWN_CONTEXT, useFactory: () => new DropdownContext() }],
})
export class DropdownMenuComponent {
}

@Component({
    selector: 'fb-dropdown-menu-trigger',
    host: { class: 'inline-block cursor-pointer', '(click)': 'context.toggle()' },
    template: '<ng-content />',
})
export class DropdownMenuTriggerComponent {
    context = inject(DROPDOWN_CONTEXT);
}

@Component({
    selector: 'fb-dropdown-menu-content',
    host: {
        class: 'absolute z-50 mt-2 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md',
        '[class.hidden]': '!context.isOpen()',
    },
    template: '<ng-content />',
})
export class DropdownMenuContentComponent {
    context = inject(DROPDOWN_CONTEXT);
}

@Component({
    selector: 'fb-dropdown-menu-item',
    host: {
        class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 block',
        '(click)': 'context.close()',
    },
    template: '<ng-content />',
})
export class DropdownMenuItemComponent {
    context = inject(DROPDOWN_CONTEXT);
}

@Component({
    selector: 'fb-dropdown-menu-separator',
    host: { class: 'block -mx-1 my-1 h-px bg-border' },
    template: '',
})
export class DropdownMenuSeparatorComponent {
}

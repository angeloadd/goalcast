import { Component, inject, InjectionToken, signal } from '@angular/core';

export class MenubarMenuContext {
    isOpen = signal(false);

    toggle(): void {
        this.isOpen.update((v) => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

const MENUBAR_MENU_CONTEXT = new InjectionToken<MenubarMenuContext>('MenubarMenuContext');

@Component({
    selector: 'gc-menubar',
    host: { class: 'flex items-center gap-1 rounded-md border border-border bg-background p-1' },
    template: '<ng-content />',
})
export class MenubarComponent {}

@Component({
    selector: 'gc-menubar-menu',
    host: { class: 'relative inline-block' },
    template: '<ng-content />',
    providers: [{ provide: MENUBAR_MENU_CONTEXT, useFactory: () => new MenubarMenuContext() }],
})
export class MenubarMenuComponent {}

@Component({
    selector: 'gc-menubar-trigger',
    host: {
        class: 'flex items-center rounded-sm px-3 py-1.5 text-sm font-medium cursor-pointer outline-none hover:bg-accent/10 transition-colors',
        '(click)': 'context.toggle()',
    },
    template: '<ng-content />',
})
export class MenubarTriggerComponent {
    context = inject(MENUBAR_MENU_CONTEXT);
}

@Component({
    selector: 'gc-menubar-content',
    host: {
        class: 'absolute z-50 mt-1 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md',
        '[class.hidden]': '!context.isOpen()',
    },
    template: '<ng-content />',
})
export class MenubarContentComponent {
    context = inject(MENUBAR_MENU_CONTEXT);
}

@Component({
    selector: 'gc-menubar-item',
    host: {
        class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 block',
        '(click)': 'context.close()',
    },
    template: '<ng-content />',
})
export class MenubarItemComponent {
    context = inject(MENUBAR_MENU_CONTEXT);
}

@Component({
    selector: 'gc-menubar-separator',
    host: { class: 'block -mx-1 my-1 h-px bg-border' },
    template: '',
})
export class MenubarSeparatorComponent {}

import { Component, inject, InjectionToken, signal } from '@angular/core';

export class PopoverContext {
    isOpen = signal(false);

    toggle(): void {
        this.isOpen.update((v) => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

const POPOVER_CONTEXT = new InjectionToken<PopoverContext>('PopoverContext');

@Component({
    selector: 'fb-popover',
    host: { class: 'relative inline-block' },
    template: '<ng-content />',
    providers: [{ provide: POPOVER_CONTEXT, useFactory: () => new PopoverContext() }],
})
export class PopoverComponent {}

@Component({
    selector: 'fb-popover-trigger',
    host: {
        class: 'inline-block cursor-pointer',
        '(click)': 'onClick()',
    },
    template: '<ng-content />',
})
export class PopoverTriggerComponent {
    private context = inject(POPOVER_CONTEXT);

    onClick(): void {
        this.context.toggle();
    }
}

@Component({
    selector: 'fb-popover-content',
    host: {
        class: 'absolute z-50 mt-2 w-72 rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-md',
        '[class.hidden]': '!context.isOpen()',
    },
    template: '<ng-content />',
})
export class PopoverContentComponent {
    context = inject(POPOVER_CONTEXT);
}

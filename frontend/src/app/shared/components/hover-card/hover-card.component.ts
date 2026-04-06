import { Component, inject, InjectionToken, signal } from '@angular/core';

export class HoverCardContext {
    isOpen = signal(false);
    private openTimer: ReturnType<typeof setTimeout> | null = null;
    private closeTimer: ReturnType<typeof setTimeout> | null = null;

    scheduleOpen(delay = 200): void {
        this.cancelClose();
        this.openTimer = setTimeout(() => this.isOpen.set(true), delay);
    }

    scheduleClose(delay = 100): void {
        this.cancelOpen();
        this.closeTimer = setTimeout(() => this.isOpen.set(false), delay);
    }

    cancelOpen(): void {
        if (this.openTimer) {
            clearTimeout(this.openTimer);
            this.openTimer = null;
        }
    }

    cancelClose(): void {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = null;
        }
    }
}

const HOVER_CARD_CONTEXT = new InjectionToken<HoverCardContext>('HoverCardContext');

@Component({
    selector: 'fb-hover-card',
    host: { class: 'relative inline-block' },
    template: '<ng-content />',
    providers: [{ provide: HOVER_CARD_CONTEXT, useFactory: () => new HoverCardContext() }],
})
export class HoverCardComponent {
}

@Component({
    selector: 'fb-hover-card-trigger',
    host: {
        class: 'inline-block',
        '(mouseenter)': 'context.scheduleOpen()',
        '(mouseleave)': 'context.scheduleClose()',
    },
    template: '<ng-content />',
})
export class HoverCardTriggerComponent {
    context = inject(HOVER_CARD_CONTEXT);
}

@Component({
    selector: 'fb-hover-card-content',
    host: {
        class: 'absolute z-50 mt-2 w-64 rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-md',
        '[class.hidden]': '!context.isOpen()',
        '(mouseenter)': 'context.cancelClose()',
        '(mouseleave)': 'context.scheduleClose()',
    },
    template: '<ng-content />',
})
export class HoverCardContentComponent {
    context = inject(HOVER_CARD_CONTEXT);
}

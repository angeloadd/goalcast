import { Component, input } from '@angular/core';

@Component({
    selector: 'fb-alert',
    host: {
        class: 'relative w-full rounded-lg border p-4 block',
        '[class.border-border]': 'variant() === "default"',
        '[class.border-destructive]': 'variant() === "destructive"',
        '[class.text-destructive]': 'variant() === "destructive"',
    },
    template: '<ng-content />',
})
export class AlertComponent {
    variant = input<'default' | 'destructive'>('default');
}

@Component({
    selector: 'fb-alert-title',
    host: { class: 'mb-1 font-medium leading-none tracking-tight block' },
    template: '<ng-content />',
})
export class AlertTitleComponent {}

@Component({
    selector: 'fb-alert-description',
    host: { class: 'text-sm [&_p]:leading-relaxed block' },
    template: '<ng-content />',
})
export class AlertDescriptionComponent {}

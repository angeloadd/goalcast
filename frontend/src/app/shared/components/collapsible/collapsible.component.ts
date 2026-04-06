import { Component, inject, InjectionToken, model } from '@angular/core';

const COLLAPSIBLE_CONTEXT = new InjectionToken<CollapsibleComponent>('CollapsibleContext');

@Component({
    selector: 'fb-collapsible',
    host: { class: 'block' },
    template: '<ng-content />',
    providers: [{ provide: COLLAPSIBLE_CONTEXT, useExisting: CollapsibleComponent }],
})
export class CollapsibleComponent {
    open = model(false);

    toggle(): void {
        this.open.set(!this.open());
    }
}

@Component({
    selector: 'fb-collapsible-trigger',
    host: { class: 'block cursor-pointer', '(click)': 'collapsible.toggle()' },
    template: '<ng-content />',
})
export class CollapsibleTriggerComponent {
    collapsible = inject(COLLAPSIBLE_CONTEXT);
}

@Component({
    selector: 'fb-collapsible-content',
    host: { class: 'block', '[class.hidden]': '!collapsible.open()' },
    template: '<ng-content />',
})
export class CollapsibleContentComponent {
    collapsible = inject(COLLAPSIBLE_CONTEXT);
}

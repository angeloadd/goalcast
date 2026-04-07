import { Component } from '@angular/core';

@Component({
    selector: 'gc-card',
    host: { class: 'bg-card text-card-foreground rounded-xl border border-border block' },
    template: '<ng-content />',
})
export class CardComponent {}

@Component({
    selector: 'gc-card-header',
    host: { class: 'flex flex-col gap-1.5 p-6 block' },
    template: '<ng-content />',
})
export class CardHeaderComponent {}

@Component({
    selector: 'gc-card-title',
    host: { class: 'text-lg font-semibold leading-none tracking-tight block' },
    template: '<ng-content />',
})
export class CardTitleComponent {}

@Component({
    selector: 'gc-card-description',
    host: { class: 'text-sm text-muted-foreground block' },
    template: '<ng-content />',
})
export class CardDescriptionComponent {}

@Component({
    selector: 'gc-card-content',
    host: { class: 'p-6 pt-0 block' },
    template: '<ng-content />',
})
export class CardContentComponent {}

@Component({
    selector: 'gc-card-footer',
    host: { class: 'flex items-center p-6 pt-0 block' },
    template: '<ng-content />',
})
export class CardFooterComponent {}

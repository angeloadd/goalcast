import { Component } from '@angular/core';

@Component({
    selector: 'fb-card',
    host: { class: 'bg-card text-card-foreground rounded-xl border border-border block' },
    template: '<ng-content />',
})
export class CardComponent {}

@Component({
    selector: 'fb-card-header',
    host: { class: 'flex flex-col gap-1.5 p-6 block' },
    template: '<ng-content />',
})
export class CardHeaderComponent {}

@Component({
    selector: 'fb-card-title',
    host: { class: 'text-lg font-semibold leading-none tracking-tight block' },
    template: '<ng-content />',
})
export class CardTitleComponent {}

@Component({
    selector: 'fb-card-description',
    host: { class: 'text-sm text-muted-foreground block' },
    template: '<ng-content />',
})
export class CardDescriptionComponent {}

@Component({
    selector: 'fb-card-content',
    host: { class: 'p-6 pt-0 block' },
    template: '<ng-content />',
})
export class CardContentComponent {}

@Component({
    selector: 'fb-card-footer',
    host: { class: 'flex items-center p-6 pt-0 block' },
    template: '<ng-content />',
})
export class CardFooterComponent {}

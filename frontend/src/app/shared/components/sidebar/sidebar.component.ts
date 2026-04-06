import { Component, inject, Injectable, signal } from '@angular/core';

@Injectable()
export class SidebarService {
    private _isOpen = signal(true);
    readonly isOpen = this._isOpen.asReadonly();

    toggle(): void {
        this._isOpen.update((v) => !v);
    }

    open(): void {
        this._isOpen.set(true);
    }

    close(): void {
        this._isOpen.set(false);
    }
}

@Component({
    selector: 'fb-sidebar',
    host: { class: 'block' },
    templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
    sidebarService = inject(SidebarService);
}

@Component({
    selector: 'fb-sidebar-header',
    host: { class: 'p-4 border-b border-sidebar-border block' },
    template: '<ng-content />',
})
export class SidebarHeaderComponent {}

@Component({
    selector: 'fb-sidebar-content',
    host: { class: 'flex-1 overflow-y-auto p-4 block' },
    template: '<ng-content />',
})
export class SidebarContentComponent {}

@Component({
    selector: 'fb-sidebar-footer',
    host: { class: 'p-4 border-t border-sidebar-border block' },
    template: '<ng-content />',
})
export class SidebarFooterComponent {}

@Component({
    selector: 'fb-sidebar-trigger',
    host: {
        class: 'lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md cursor-pointer',
        '(click)': 'sidebarService.toggle()',
    },
    template: '<ng-content />',
})
export class SidebarTriggerComponent {
    sidebarService = inject(SidebarService);
}

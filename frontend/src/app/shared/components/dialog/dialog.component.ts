import { Component, ElementRef, output, viewChild } from '@angular/core';

@Component({
    selector: 'fb-dialog',
    templateUrl: './dialog.component.html',
})
export class DialogComponent {
    private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
    closed = output<void>();

    open(): void {
        const el = this.dialogEl().nativeElement;
        if (el.showModal) {
            el.showModal();
        } else {
            el.setAttribute('open', '');
        }
    }

    close(): void {
        const el = this.dialogEl().nativeElement;
        if (el.close) {
            el.close();
        } else {
            el.removeAttribute('open');
        }
    }

    get isOpen(): boolean {
        return this.dialogEl().nativeElement.open;
    }
}

@Component({
    selector: 'fb-dialog-header',
    host: { class: 'flex flex-col gap-1.5 mb-4 block' },
    template: '<ng-content />',
})
export class DialogHeaderComponent {}

@Component({
    selector: 'fb-dialog-title',
    host: { class: 'text-lg font-semibold leading-none tracking-tight block' },
    template: '<ng-content />',
})
export class DialogTitleComponent {}

@Component({
    selector: 'fb-dialog-description',
    host: { class: 'text-sm text-muted-foreground block' },
    template: '<ng-content />',
})
export class DialogDescriptionComponent {}

@Component({
    selector: 'fb-dialog-footer',
    host: { class: 'flex justify-end gap-2 mt-6 block' },
    template: '<ng-content />',
})
export class DialogFooterComponent {}

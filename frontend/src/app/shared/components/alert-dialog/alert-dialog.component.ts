import { Component, ElementRef, inject, InjectionToken, output, viewChild } from '@angular/core';

const ALERT_DIALOG_CONTEXT = new InjectionToken<AlertDialogComponent>('AlertDialogContext');

@Component({
    selector: 'fb-alert-dialog',
    template: `
        <dialog
            #dialogEl
            class="bg-card text-card-foreground rounded-xl border border-border shadow-lg p-0 w-full max-w-md backdrop:bg-black/50 backdrop:backdrop-blur-sm"
            (cancel)="$event.preventDefault()"
        >
            <div class="p-6">
                <ng-content />
            </div>
        </dialog>
    `,
    providers: [{ provide: ALERT_DIALOG_CONTEXT, useExisting: AlertDialogComponent }],
})
export class AlertDialogComponent {
    private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
    confirmed = output<void>();

    open(): void {
        const el = this.dialogEl().nativeElement;
        if (typeof el.showModal === 'function') {
            el.showModal();
        } else {
            el.setAttribute('open', '');
        }
    }

    close(): void {
        const el = this.dialogEl().nativeElement;
        if (typeof el.close === 'function') {
            el.close();
        } else {
            el.removeAttribute('open');
        }
    }

    confirm(): void {
        this.confirmed.emit();
        this.close();
    }
}

@Component({
    selector: 'fb-alert-dialog-header',
    host: { class: 'flex flex-col gap-1.5 mb-4 block' },
    template: '<ng-content />',
})
export class AlertDialogHeaderComponent {}

@Component({
    selector: 'fb-alert-dialog-title',
    host: { class: 'text-lg font-semibold leading-none tracking-tight block' },
    template: '<ng-content />',
})
export class AlertDialogTitleComponent {}

@Component({
    selector: 'fb-alert-dialog-description',
    host: { class: 'text-sm text-muted-foreground block' },
    template: '<ng-content />',
})
export class AlertDialogDescriptionComponent {}

@Component({
    selector: 'fb-alert-dialog-footer',
    host: { class: 'flex justify-end gap-2 mt-6 block' },
    template: '<ng-content />',
})
export class AlertDialogFooterComponent {}

@Component({
    selector: 'fb-alert-dialog-cancel',
    template: ` <button class="btn btn-outline" (click)="dialog.close()">
        <ng-content />
    </button>`,
})
export class AlertDialogCancelComponent {
    dialog = inject(ALERT_DIALOG_CONTEXT);
}

@Component({
    selector: 'fb-alert-dialog-action',
    template: ` <button class="btn btn-destructive" (click)="dialog.confirm()">
        <ng-content />
    </button>`,
})
export class AlertDialogActionComponent {
    dialog = inject(ALERT_DIALOG_CONTEXT);
}

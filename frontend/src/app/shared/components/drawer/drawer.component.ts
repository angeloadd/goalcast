import {Component, ElementRef, output, viewChild} from '@angular/core';

@Component({
  selector: 'fb-drawer',
  template: `
    <dialog #dialogEl
      class="fixed inset-x-0 bottom-0 mt-auto bg-card text-card-foreground rounded-t-xl border-t border-border shadow-lg p-0 w-full max-h-[85vh] backdrop:bg-black/50 m-0"
      (close)="closed.emit()">
      <div class="mx-auto w-12 h-1.5 rounded-full bg-muted mt-4" data-drag-handle></div>
      <div class="p-6 overflow-y-auto"><ng-content /></div>
    </dialog>
  `,
})
export class DrawerComponent {
  private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  closed = output<void>();

  open(): void {
    const el = this.dialogEl().nativeElement;
    if (typeof el.showModal === 'function') el.showModal(); else el.setAttribute('open', '');
  }
  close(): void {
    const el = this.dialogEl().nativeElement;
    if (typeof el.close === 'function') el.close(); else el.removeAttribute('open');
  }
  get isOpen(): boolean { return this.dialogEl().nativeElement.open; }
}

@Component({ selector: 'fb-drawer-header', host: {class: 'flex flex-col gap-1.5 mb-4 block'}, template: '<ng-content />' })
export class DrawerHeaderComponent {}

@Component({ selector: 'fb-drawer-title', host: {class: 'text-lg font-semibold leading-none tracking-tight block'}, template: '<ng-content />' })
export class DrawerTitleComponent {}

@Component({ selector: 'fb-drawer-description', host: {class: 'text-sm text-muted-foreground block'}, template: '<ng-content />' })
export class DrawerDescriptionComponent {}

@Component({ selector: 'fb-drawer-footer', host: {class: 'flex justify-end gap-2 mt-6 block'}, template: '<ng-content />' })
export class DrawerFooterComponent {}

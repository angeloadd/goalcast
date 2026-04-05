import {Component, inject, InjectionToken, signal} from '@angular/core';

export class ContextMenuContext {
  isOpen = signal(false);
  posX = signal(0);
  posY = signal(0);
  openAt(x: number, y: number): void { this.posX.set(x); this.posY.set(y); this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
}

const CONTEXT_MENU_CONTEXT = new InjectionToken<ContextMenuContext>('ContextMenuContext');

@Component({
  selector: 'fb-context-menu',
  host: {class: 'block'},
  template: '<ng-content />',
  providers: [{provide: CONTEXT_MENU_CONTEXT, useFactory: () => new ContextMenuContext()}],
})
export class ContextMenuComponent {}

@Component({
  selector: 'fb-context-menu-trigger',
  host: {class: 'block', '(contextmenu)': 'onContextMenu($event)'},
  template: '<ng-content />',
})
export class ContextMenuTriggerComponent {
  private context = inject(CONTEXT_MENU_CONTEXT);
  onContextMenu(event: MouseEvent): void { event.preventDefault(); this.context.openAt(event.clientX, event.clientY); }
}

@Component({
  selector: 'fb-context-menu-content',
  host: {
    class: 'fixed z-50 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md',
    '[class.hidden]': '!context.isOpen()',
    '[style.left.px]': 'context.posX()',
    '[style.top.px]': 'context.posY()',
  },
  template: '<ng-content />',
})
export class ContextMenuContentComponent { context = inject(CONTEXT_MENU_CONTEXT); }

@Component({
  selector: 'fb-context-menu-item',
  host: {
    class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 block',
    '(click)': 'context.close()',
  },
  template: '<ng-content />',
})
export class ContextMenuItemComponent { context = inject(CONTEXT_MENU_CONTEXT); }

@Component({ selector: 'fb-context-menu-separator', host: {class: 'block -mx-1 my-1 h-px bg-border'}, template: '' })
export class ContextMenuSeparatorComponent {}

import {Component, computed, inject, InjectionToken, input, model, signal, OnInit} from '@angular/core';

export class TabsContext {
  activeValue = signal('');

  select(value: string): void {
    this.activeValue.set(value);
  }
}

const TABS_CONTEXT = new InjectionToken<TabsContext>('TabsContext');

@Component({
  selector: 'fb-tabs',
  host: {class: 'block'},
  template: '<ng-content />',
  providers: [{provide: TABS_CONTEXT, useFactory: () => new TabsContext()}],
})
export class TabsComponent implements OnInit {
  private context = inject(TABS_CONTEXT);
  value = model.required<string>();

  ngOnInit(): void {
    this.context.activeValue.set(this.value());
  }
}

@Component({
  selector: 'fb-tabs-list',
  host: {class: 'inline-flex items-center gap-1 border-b border-border w-full block'},
  template: '<ng-content />',
})
export class TabsListComponent {}

@Component({
  selector: 'fb-tabs-trigger',
  host: {
    class: 'inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors',
    '[attr.data-state]': 'isActive() ? "active" : "inactive"',
    '[class.border-b-2]': 'isActive()',
    '[class.border-primary]': 'isActive()',
    '[class.text-foreground]': 'isActive()',
    '[class.text-muted-foreground]': '!isActive()',
    '(click)': 'onClick()',
  },
  template: '<ng-content />',
})
export class TabsTriggerComponent {
  private context = inject(TABS_CONTEXT);
  value = input.required<string>();
  isActive = computed(() => this.context.activeValue() === this.value());

  onClick(): void {
    this.context.select(this.value());
  }
}

@Component({
  selector: 'fb-tabs-content',
  host: {
    class: 'mt-4 block',
    '[class.hidden]': '!isActive()',
  },
  template: '<ng-content />',
})
export class TabsContentComponent {
  private context = inject(TABS_CONTEXT);
  value = input.required<string>();
  isActive = computed(() => this.context.activeValue() === this.value());
}

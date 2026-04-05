import {Component, inject, InjectionToken, input, OnInit, signal} from '@angular/core';

export class AccordionContext {
  type = signal<'single' | 'multiple'>('single');
  openItems = signal<Set<string>>(new Set());

  toggle(value: string): void {
    this.openItems.update(items => {
      const next = new Set(items);
      if (next.has(value)) {
        next.delete(value);
      } else {
        if (this.type() === 'single') {
          next.clear();
        }
        next.add(value);
      }
      return next;
    });
  }

  isOpen(value: string): boolean {
    return this.openItems().has(value);
  }
}

const ACCORDION_CONTEXT = new InjectionToken<AccordionContext>('AccordionContext');

@Component({
  selector: 'fb-accordion',
  host: {class: 'block'},
  template: '<div class="divide-y divide-border"><ng-content /></div>',
  providers: [{provide: ACCORDION_CONTEXT, useFactory: () => new AccordionContext()}],
})
export class AccordionComponent implements OnInit {
  private context = inject(ACCORDION_CONTEXT);
  type = input<'single' | 'multiple'>('single');

  ngOnInit(): void {
    this.context.type.set(this.type());
  }
}

@Component({
  selector: 'fb-accordion-item',
  host: {class: 'block py-4'},
  template: '<ng-content />',
})
export class AccordionItemComponent {
  value = input.required<string>();
}

@Component({
  selector: 'fb-accordion-trigger',
  host: {
    class: 'flex w-full items-center justify-between text-sm font-medium cursor-pointer transition-all hover:underline',
    '(click)': 'onClick()',
  },
  template: `
    <ng-content />
    <svg
      class="h-4 w-4 shrink-0 transition-transform duration-200"
      [class.rotate-180]="isOpen()"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    ><path d="m6 9 6 6 6-6"/></svg>
  `,
})
export class AccordionTriggerComponent {
  private context = inject(ACCORDION_CONTEXT);
  private item = inject(AccordionItemComponent);

  isOpen(): boolean {
    return this.context.isOpen(this.item.value());
  }

  onClick(): void {
    this.context.toggle(this.item.value());
  }
}

@Component({
  selector: 'fb-accordion-content',
  host: {
    class: 'text-sm pt-2 block',
    '[class.hidden]': '!isOpen()',
  },
  template: '<ng-content />',
})
export class AccordionContentComponent {
  private context = inject(ACCORDION_CONTEXT);
  private item = inject(AccordionItemComponent);

  isOpen(): boolean {
    return this.context.isOpen(this.item.value());
  }
}

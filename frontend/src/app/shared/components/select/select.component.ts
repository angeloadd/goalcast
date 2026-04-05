import {Component, ElementRef, forwardRef, inject, input, signal, InjectionToken} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

const SELECT_CONTEXT = new InjectionToken<SelectContext>('SelectContext');

export class SelectContext {
  selectedValue = signal('');
  selectedLabel = signal('');
  isOpen = signal(false);
  private onChange: (value: string) => void = () => {};

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  select(value: string, label: string): void {
    this.selectedValue.set(value);
    this.selectedLabel.set(label);
    this.isOpen.set(false);
    this.onChange(value);
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }
}

@Component({
  selector: 'fb-select',
  templateUrl: './select.component.html',
  providers: [
    {provide: SELECT_CONTEXT, useFactory: () => new SelectContext()},
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true},
  ],
})
export class SelectComponent implements ControlValueAccessor {
  private context = inject(SELECT_CONTEXT);
  placeholder = input('');

  selectedLabel = this.context.selectedLabel;
  isOpen = this.context.isOpen;

  toggleOpen(): void {
    this.context.toggleOpen();
  }

  writeValue(value: string): void {
    this.context.selectedValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.context.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {}
}

@Component({
  selector: 'fb-select-item',
  host: {
    class: 'block px-3 py-2 text-sm cursor-pointer hover:bg-accent/10 transition-colors',
    '(click)': 'onSelect()',
  },
  template: '<ng-content />',
})
export class SelectItemComponent {
  private context = inject(SELECT_CONTEXT);
  private el = inject(ElementRef);
  value = input.required<string>();

  onSelect(): void {
    const label = this.el.nativeElement.textContent?.trim() ?? this.value();
    this.context.select(this.value(), label);
  }
}

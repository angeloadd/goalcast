import {
    Component,
    computed,
    ElementRef,
    inject,
    InjectionToken,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';

const COMMAND_CONTEXT = new InjectionToken<CommandComponent>('CommandContext');

@Component({
    selector: 'fb-command',
    template: `
        <dialog
            #dialogEl
            class="bg-card text-card-foreground rounded-xl border border-border shadow-lg p-0 w-full max-w-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        >
            <div class="flex items-center border-b border-border px-3">
                <svg
                    class="h-4 w-4 shrink-0 opacity-50 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    data-command-input
                    class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Type a command or search..."
                    [value]="search()"
                    (input)="onSearch($event)"
                />
            </div>
            <div class="max-h-[300px] overflow-y-auto p-2">
                <ng-content />
            </div>
        </dialog>
    `,
    providers: [{ provide: COMMAND_CONTEXT, useExisting: CommandComponent }],
})
export class CommandComponent {
    private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
    search = signal('');
    selected = output<string>();

    open(): void {
        this.search.set('');
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

    selectItem(value: string): void {
        this.selected.emit(value);
        this.close();
    }

    onSearch(event: Event): void {
        this.search.set((event.target as HTMLInputElement).value);
    }

    hasVisibleItems(): boolean {
        const dialog = this.dialogEl().nativeElement;
        return dialog.querySelectorAll('fb-command-item:not(.hidden)').length > 0;
    }
}

@Component({
    selector: 'fb-command-group',
    host: { class: 'block' },
    template: ` <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {{ heading() }}
        </div>
        <ng-content />`,
})
export class CommandGroupComponent {
    heading = input('');
}

@Component({
    selector: 'fb-command-item',
    host: {
        class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10',
        '[class.hidden]': '!isVisible()',
        '(click)': 'onSelect()',
    },
    template: '<ng-content />',
})
export class CommandItemComponent {
    private command = inject(COMMAND_CONTEXT);
    private el = inject(ElementRef);
    value = input.required<string>();

    isVisible = computed(() => {
        const query = this.command.search().toLowerCase();
        if (!query) {
            return true;
        }
        const text = this.el.nativeElement.textContent?.toLowerCase() ?? '';
        return text.includes(query);
    });

    onSelect(): void {
        this.command.selectItem(this.value());
    }
}

@Component({
    selector: 'fb-command-empty',
    host: {
        class: 'py-6 text-center text-sm text-muted-foreground',
        '[class.hidden]': 'command.hasVisibleItems()',
    },
    template: '<ng-content />',
})
export class CommandEmptyComponent {
    command = inject(COMMAND_CONTEXT);
}

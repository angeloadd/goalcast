import { Component } from '@angular/core';

@Component({
    selector: 'gc-scroll-area',
    host: { class: 'relative block' },
    styles: `
        .scroll-container {
            overflow: auto;
            scrollbar-width: thin;
            scrollbar-color: hsl(var(--border)) transparent;
        }

        .scroll-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .scroll-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .scroll-container::-webkit-scrollbar-thumb {
            background-color: hsl(var(--border));
            border-radius: 9999px;
        }
    `,
    template: ` <div data-scroll-area class="scroll-container h-full w-full">
        <ng-content />
    </div>`,
})
export class ScrollAreaComponent {}

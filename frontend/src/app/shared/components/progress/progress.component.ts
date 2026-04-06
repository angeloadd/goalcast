import { Component, computed, input } from '@angular/core';

@Component({
    selector: 'fb-progress',
    host: { class: 'block w-full bg-secondary rounded-full overflow-hidden' },
    templateUrl: './progress.component.html',
    styles: `
        :host {
            height: 0.5rem;
        }
    `,
})
export class ProgressComponent {
    value = input<number>(0);
    clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));
}

import { Component, input } from '@angular/core';

@Component({
    selector: 'gc-skeleton',
    template: ` <div
        data-skeleton
        class="animate-pulse rounded-md bg-muted"
        [class]="class()"
    ></div>`,
})
export class SkeletonComponent {
    class = input('h-4 w-full');
}

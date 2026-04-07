import { Component, computed, input, output } from '@angular/core';

@Component({
    selector: 'gc-pagination',
    template: `
        <nav class="flex items-center justify-center gap-1">
            <button
                data-prev
                class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                [disabled]="currentPage() <= 1"
                (click)="goToPage(currentPage() - 1)"
            >
                Previous
            </button>
            @for (page of pages(); track page) {
                <button
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 cursor-pointer transition-colors"
                    [class.bg-accent]="page === currentPage()"
                    [class.text-accent-foreground]="page === currentPage()"
                    [class.hover:bg-muted]="page !== currentPage()"
                    (click)="goToPage(page)"
                >
                    {{ page }}
                </button>
            }
            <button
                data-next
                class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                [disabled]="currentPage() >= totalPages()"
                (click)="goToPage(currentPage() + 1)"
            >
                Next
            </button>
        </nav>
    `,
})
export class PaginationComponent {
    currentPage = input.required<number>();
    totalPages = input.required<number>();
    pageChange = output<number>();

    pages = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            const start = Math.max(1, current - 2);
            const end = Math.min(total, current + 2);
            if (start > 1) {
                pages.push(1);
            }
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (end < total) {
                pages.push(total);
            }
        }
        return pages;
    });

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.pageChange.emit(page);
        }
    }
}

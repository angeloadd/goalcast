import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';

@Directive({
    selector: '[gcTooltip]',
})
export class TooltipDirective {
    gcTooltip = input.required<string>();
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private tooltipEl: HTMLElement | null = null;

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.show();
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.hide();
    }

    private show(): void {
        if (this.tooltipEl) {
            return;
        }
        this.tooltipEl = this.renderer.createElement('div');
        this.renderer.setAttribute(this.tooltipEl, 'data-tooltip', '');
        this.renderer.addClass(this.tooltipEl, 'absolute');
        this.renderer.addClass(this.tooltipEl, 'z-50');
        this.renderer.addClass(this.tooltipEl, 'rounded-md');
        this.renderer.addClass(this.tooltipEl, 'bg-primary');
        this.renderer.addClass(this.tooltipEl, 'text-primary-foreground');
        this.renderer.addClass(this.tooltipEl, 'px-3');
        this.renderer.addClass(this.tooltipEl, 'py-1.5');
        this.renderer.addClass(this.tooltipEl, 'text-xs');
        this.renderer.addClass(this.tooltipEl, 'shadow-md');
        const text = this.renderer.createText(this.gcTooltip());
        this.renderer.appendChild(this.tooltipEl, text);

        const hostEl = this.el.nativeElement as HTMLElement;
        this.renderer.setStyle(hostEl, 'position', 'relative');
        this.renderer.setStyle(this.tooltipEl, 'bottom', '100%');
        this.renderer.setStyle(this.tooltipEl, 'left', '50%');
        this.renderer.setStyle(this.tooltipEl, 'transform', 'translateX(-50%)');
        this.renderer.setStyle(this.tooltipEl, 'margin-bottom', '4px');
        this.renderer.setStyle(this.tooltipEl, 'white-space', 'nowrap');
        this.renderer.appendChild(hostEl, this.tooltipEl);
    }

    private hide(): void {
        if (this.tooltipEl) {
            this.renderer.removeChild(this.el.nativeElement, this.tooltipEl);
            this.tooltipEl = null;
        }
    }
}

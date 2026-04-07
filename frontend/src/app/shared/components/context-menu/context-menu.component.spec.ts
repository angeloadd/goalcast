import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    ContextMenuComponent,
    ContextMenuContentComponent,
    ContextMenuItemComponent,
    ContextMenuSeparatorComponent,
    ContextMenuTriggerComponent,
} from '@fb/shared/components';

@Component({
    template: `
        <gc-context-menu>
            <gc-context-menu-trigger>
                <div style="width: 200px; height: 100px;">Right-click area</div>
            </gc-context-menu-trigger>
            <gc-context-menu-content>
                <gc-context-menu-item>Copy</gc-context-menu-item>
                <gc-context-menu-separator></gc-context-menu-separator>
                <gc-context-menu-item>Paste</gc-context-menu-item>
            </gc-context-menu-content>
        </gc-context-menu>
    `,
    imports: [
        ContextMenuComponent,
        ContextMenuTriggerComponent,
        ContextMenuContentComponent,
        ContextMenuItemComponent,
        ContextMenuSeparatorComponent,
    ],
})
class TestHostComponent {}

describe('ContextMenuComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should hide menu by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-context-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show menu on contextmenu event', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'gc-context-menu-trigger',
        ) as HTMLElement;
        trigger.dispatchEvent(
            new MouseEvent('contextmenu', { clientX: 100, clientY: 50, bubbles: true }),
        );
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-context-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should close on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'gc-context-menu-trigger',
        ) as HTMLElement;
        trigger.dispatchEvent(
            new MouseEvent('contextmenu', { clientX: 100, clientY: 50, bubbles: true }),
        );
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('gc-context-menu-item') as HTMLElement;
        item.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'gc-context-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});

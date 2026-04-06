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
        <fb-context-menu>
            <fb-context-menu-trigger>
                <div style="width: 200px; height: 100px;">Right-click area</div>
            </fb-context-menu-trigger>
            <fb-context-menu-content>
                <fb-context-menu-item>Copy</fb-context-menu-item>
                <fb-context-menu-separator></fb-context-menu-separator>
                <fb-context-menu-item>Paste</fb-context-menu-item>
            </fb-context-menu-content>
        </fb-context-menu>
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
            'fb-context-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show menu on contextmenu event', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'fb-context-menu-trigger',
        ) as HTMLElement;
        trigger.dispatchEvent(
            new MouseEvent('contextmenu', { clientX: 100, clientY: 50, bubbles: true }),
        );
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'fb-context-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should close on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector(
            'fb-context-menu-trigger',
        ) as HTMLElement;
        trigger.dispatchEvent(
            new MouseEvent('contextmenu', { clientX: 100, clientY: 50, bubbles: true }),
        );
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('fb-context-menu-item') as HTMLElement;
        item.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
            'fb-context-menu-content',
        ) as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    MenubarComponent,
    MenubarContentComponent,
    MenubarItemComponent,
    MenubarMenuComponent,
    MenubarSeparatorComponent,
    MenubarTriggerComponent,
} from './menubar.component';

@Component({
    template: `
        <gc-menubar>
            <gc-menubar-menu>
                <gc-menubar-trigger>File</gc-menubar-trigger>
                <gc-menubar-content>
                    <gc-menubar-item>New</gc-menubar-item>
                    <gc-menubar-separator></gc-menubar-separator>
                    <gc-menubar-item>Open</gc-menubar-item>
                </gc-menubar-content>
            </gc-menubar-menu>
            <gc-menubar-menu>
                <gc-menubar-trigger>Edit</gc-menubar-trigger>
                <gc-menubar-content>
                    <gc-menubar-item>Undo</gc-menubar-item>
                </gc-menubar-content>
            </gc-menubar-menu>
        </gc-menubar>
    `,
    imports: [
        MenubarComponent,
        MenubarMenuComponent,
        MenubarTriggerComponent,
        MenubarContentComponent,
        MenubarItemComponent,
        MenubarSeparatorComponent,
    ],
})
class TestHostComponent {}

describe('MenubarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should render all menu triggers', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll(
            'gc-menubar-trigger',
        ) as NodeListOf<HTMLElement>;
        expect(triggers.length).toBe(2);
        expect(triggers[0].textContent).toContain('File');
    });

    it('should hide all menus by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'gc-menubar-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should open menu on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('gc-menubar-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'gc-menubar-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(false);
    });

    it('should close menu on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('gc-menubar-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('gc-menubar-item') as HTMLElement;
        item.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('gc-menubar-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});

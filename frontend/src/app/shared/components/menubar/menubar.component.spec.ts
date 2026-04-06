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
        <fb-menubar>
            <fb-menubar-menu>
                <fb-menubar-trigger>File</fb-menubar-trigger>
                <fb-menubar-content>
                    <fb-menubar-item>New</fb-menubar-item>
                    <fb-menubar-separator></fb-menubar-separator>
                    <fb-menubar-item>Open</fb-menubar-item>
                </fb-menubar-content>
            </fb-menubar-menu>
            <fb-menubar-menu>
                <fb-menubar-trigger>Edit</fb-menubar-trigger>
                <fb-menubar-content>
                    <fb-menubar-item>Undo</fb-menubar-item>
                </fb-menubar-content>
            </fb-menubar-menu>
        </fb-menubar>
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
            'fb-menubar-trigger',
        ) as NodeListOf<HTMLElement>;
        expect(triggers.length).toBe(2);
        expect(triggers[0].textContent).toContain('File');
    });

    it('should hide all menus by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'fb-menubar-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should open menu on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-menubar-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll(
            'fb-menubar-content',
        ) as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(false);
    });

    it('should close menu on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-menubar-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('fb-menubar-item') as HTMLElement;
        item.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-menubar-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});

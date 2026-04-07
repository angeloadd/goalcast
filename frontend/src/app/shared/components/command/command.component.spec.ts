import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    CommandComponent,
    CommandEmptyComponent,
    CommandGroupComponent,
    CommandItemComponent,
} from './command.component';

@Component({
    template: `
        <gc-command #cmd>
            <gc-command-group heading="Actions">
                <gc-command-item value="profile">Go to Profile</gc-command-item>
                <gc-command-item value="settings">Open Settings</gc-command-item>
            </gc-command-group>
            <gc-command-group heading="Pages">
                <gc-command-item value="dashboard">Dashboard</gc-command-item>
            </gc-command-group>
            <gc-command-empty>No results found.</gc-command-empty>
        </gc-command>
    `,
    imports: [CommandComponent, CommandGroupComponent, CommandItemComponent, CommandEmptyComponent],
})
class TestHostComponent {
    cmd = viewChild.required<CommandComponent>('cmd');
}

describe('CommandComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should be closed by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
        expect(dialog.open).toBe(false);
    });

    it('should open and show search input', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
            'input[data-command-input]',
        ) as HTMLInputElement;
        expect(input).toBeTruthy();
    });

    it('should render all items when no search', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const items = fixture.nativeElement.querySelectorAll(
            'gc-command-item',
        ) as NodeListOf<HTMLElement>;
        expect(items.length).toBe(3);
    });

    it('should filter items based on search', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
            'input[data-command-input]',
        ) as HTMLInputElement;
        input.value = 'profile';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        const visibleItems = fixture.nativeElement.querySelectorAll(
            'gc-command-item:not(.hidden)',
        ) as NodeListOf<HTMLElement>;
        expect(visibleItems.length).toBe(1);
        expect(visibleItems[0].textContent).toContain('Go to Profile');
    });

    it('should show empty message when no matches', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
            'input[data-command-input]',
        ) as HTMLInputElement;
        input.value = 'zzzznothing';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        const empty = fixture.nativeElement.querySelector('gc-command-empty') as HTMLElement;
        expect(empty.classList.contains('hidden')).toBe(false);
    });

    it('should emit selected and close on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        let selectedValue = '';
        fixture.componentInstance.cmd().selected.subscribe((v: string) => (selectedValue = v));
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('gc-command-item') as HTMLElement;
        item.click();
        expect(selectedValue).toBe('profile');
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });
});

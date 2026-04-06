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
        <fb-command #cmd>
            <fb-command-group heading="Actions">
                <fb-command-item value="profile">Go to Profile</fb-command-item>
                <fb-command-item value="settings">Open Settings</fb-command-item>
            </fb-command-group>
            <fb-command-group heading="Pages">
                <fb-command-item value="dashboard">Dashboard</fb-command-item>
            </fb-command-group>
            <fb-command-empty>No results found.</fb-command-empty>
        </fb-command>
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
            'fb-command-item',
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
            'fb-command-item:not(.hidden)',
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
        const empty = fixture.nativeElement.querySelector('fb-command-empty') as HTMLElement;
        expect(empty.classList.contains('hidden')).toBe(false);
    });

    it('should emit selected and close on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        let selectedValue = '';
        fixture.componentInstance.cmd().selected.subscribe((v: string) => (selectedValue = v));
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('fb-command-item') as HTMLElement;
        item.click();
        expect(selectedValue).toBe('profile');
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });
});

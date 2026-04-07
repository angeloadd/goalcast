import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    AlertDialogActionComponent,
    AlertDialogCancelComponent,
    AlertDialogComponent,
    AlertDialogDescriptionComponent,
    AlertDialogFooterComponent,
    AlertDialogHeaderComponent,
    AlertDialogTitleComponent,
} from '@fb/shared/components';

@Component({
    template: `
        <gc-alert-dialog #dialog>
            <gc-alert-dialog-header>
                <gc-alert-dialog-title>Are you sure?</gc-alert-dialog-title>
                <gc-alert-dialog-description
                    >This action cannot be undone.
                </gc-alert-dialog-description>
            </gc-alert-dialog-header>
            <gc-alert-dialog-footer>
                <gc-alert-dialog-cancel>Cancel</gc-alert-dialog-cancel>
                <gc-alert-dialog-action>Continue</gc-alert-dialog-action>
            </gc-alert-dialog-footer>
        </gc-alert-dialog>
    `,
    imports: [
        AlertDialogComponent,
        AlertDialogHeaderComponent,
        AlertDialogTitleComponent,
        AlertDialogDescriptionComponent,
        AlertDialogFooterComponent,
        AlertDialogActionComponent,
        AlertDialogCancelComponent,
    ],
})
class TestHostComponent {
    dialog = viewChild.required<AlertDialogComponent>('dialog');
}

describe('AlertDialogComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should be closed by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
        expect(dialog.open).toBe(false);
    });

    it('should open when open() is called', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.dialog().open();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    });

    it('should close when cancel is clicked', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.dialog().open();
        const cancel = fixture.nativeElement.querySelector(
            'gc-alert-dialog-cancel button',
        ) as HTMLElement;
        cancel.click();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should emit confirmed and close when action is clicked', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        let confirmed = false;
        fixture.componentInstance.dialog().confirmed.subscribe(() => (confirmed = true));
        fixture.componentInstance.dialog().open();
        const action = fixture.nativeElement.querySelector(
            'gc-alert-dialog-action button',
        ) as HTMLElement;
        action.click();
        expect(confirmed).toBe(true);
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should render title and description', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('gc-alert-dialog-title')?.textContent).toContain('Are you sure?');
        expect(el.querySelector('gc-alert-dialog-description')?.textContent).toContain(
            'This action cannot be undone.',
        );
    });
});

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
        <fb-alert-dialog #dialog>
            <fb-alert-dialog-header>
                <fb-alert-dialog-title>Are you sure?</fb-alert-dialog-title>
                <fb-alert-dialog-description
                    >This action cannot be undone.
                </fb-alert-dialog-description>
            </fb-alert-dialog-header>
            <fb-alert-dialog-footer>
                <fb-alert-dialog-cancel>Cancel</fb-alert-dialog-cancel>
                <fb-alert-dialog-action>Continue</fb-alert-dialog-action>
            </fb-alert-dialog-footer>
        </fb-alert-dialog>
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
            'fb-alert-dialog-cancel button',
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
            'fb-alert-dialog-action button',
        ) as HTMLElement;
        action.click();
        expect(confirmed).toBe(true);
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should render title and description', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('fb-alert-dialog-title')?.textContent).toContain('Are you sure?');
        expect(el.querySelector('fb-alert-dialog-description')?.textContent).toContain(
            'This action cannot be undone.',
        );
    });
});

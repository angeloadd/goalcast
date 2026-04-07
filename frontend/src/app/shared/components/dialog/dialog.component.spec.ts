import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    DialogComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
} from './dialog.component';

@Component({
    template: `
        <gc-dialog #dialog>
            <gc-dialog-header>
                <gc-dialog-title>My Dialog</gc-dialog-title>
                <gc-dialog-description>A description</gc-dialog-description>
            </gc-dialog-header>
            <p>Content</p>
            <gc-dialog-footer>
                <button (click)="dialog.close()">Close</button>
            </gc-dialog-footer>
        </gc-dialog>
        <button (click)="dialog.open()">Open</button>
    `,
    imports: [
        DialogComponent,
        DialogHeaderComponent,
        DialogTitleComponent,
        DialogDescriptionComponent,
        DialogFooterComponent,
    ],
})
class TestHostComponent {
    dialog = viewChild.required<DialogComponent>('dialog');
}

describe('DialogComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
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

    it('should close when close() is called', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const comp = fixture.componentInstance.dialog();
        comp.open();
        comp.close();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should render sub-components', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('gc-dialog-title')?.textContent).toContain('My Dialog');
        expect(el.querySelector('gc-dialog-description')?.textContent).toContain('A description');
    });
});

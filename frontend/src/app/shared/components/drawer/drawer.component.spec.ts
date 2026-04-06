import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    DrawerComponent,
    DrawerDescriptionComponent,
    DrawerFooterComponent,
    DrawerHeaderComponent,
    DrawerTitleComponent,
} from './drawer.component';

@Component({
    template: `
        <fb-drawer #drawer>
            <fb-drawer-header>
                <fb-drawer-title>Edit Profile</fb-drawer-title>
                <fb-drawer-description>Make changes to your profile.</fb-drawer-description>
            </fb-drawer-header>
            <p>Drawer body</p>
            <fb-drawer-footer>
                <button (click)="drawer.close()">Close</button>
            </fb-drawer-footer>
        </fb-drawer>
    `,
    imports: [
        DrawerComponent,
        DrawerHeaderComponent,
        DrawerTitleComponent,
        DrawerDescriptionComponent,
        DrawerFooterComponent,
    ],
})
class TestHostComponent {
    drawer = viewChild.required<DrawerComponent>('drawer');
}

describe('DrawerComponent', () => {
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
        fixture.componentInstance.drawer().open();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    });

    it('should close when close() is called', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const comp = fixture.componentInstance.drawer();
        comp.open();
        comp.close();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should render drag handle', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[data-drag-handle]')).toBeTruthy();
    });

    it('should render sub-components', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('fb-drawer-title')?.textContent).toContain('Edit Profile');
        expect(el.querySelector('fb-drawer-description')?.textContent).toContain('Make changes');
    });
});

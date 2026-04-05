import {Component, viewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogDescriptionComponent, DialogFooterComponent} from './dialog.component';

@Component({
  template: `
    <fb-dialog #dialog>
      <fb-dialog-header>
        <fb-dialog-title>My Dialog</fb-dialog-title>
        <fb-dialog-description>A description</fb-dialog-description>
      </fb-dialog-header>
      <p>Content</p>
      <fb-dialog-footer>
        <button (click)="dialog.close()">Close</button>
      </fb-dialog-footer>
    </fb-dialog>
    <button (click)="dialog.open()">Open</button>
  `,
  imports: [DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogDescriptionComponent, DialogFooterComponent],
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
    expect(el.querySelector('fb-dialog-title')?.textContent).toContain('My Dialog');
    expect(el.querySelector('fb-dialog-description')?.textContent).toContain('A description');
  });
});

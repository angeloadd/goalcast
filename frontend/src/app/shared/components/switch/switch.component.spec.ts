import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SwitchComponent } from './switch.component';

@Component({
    template: `
        <fb-switch [formControl]="ctrl"></fb-switch>`,
    imports: [SwitchComponent, ReactiveFormsModule],
})
class TestHostComponent {
    ctrl = new FormControl(false);
}

describe('SwitchComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render off by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const toggle = fixture.nativeElement.querySelector('[data-switch]') as HTMLElement;
        expect(toggle.getAttribute('data-state')).toBe('unchecked');
    });

    it('should toggle on click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const toggle = fixture.nativeElement.querySelector('[data-switch]') as HTMLElement;
        toggle.click();
        expect(fixture.componentInstance.ctrl.value).toBe(true);
    });

    it('should reflect formControl value', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.setValue(true);
        fixture.detectChanges();
        const toggle = fixture.nativeElement.querySelector('[data-switch]') as HTMLElement;
        expect(toggle.getAttribute('data-state')).toBe('checked');
    });
});

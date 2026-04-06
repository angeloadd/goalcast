import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

@Component({
    template: ` <fb-checkbox [formControl]="ctrl"></fb-checkbox>`,
    imports: [CheckboxComponent, ReactiveFormsModule],
})
class TestHostComponent {
    ctrl = new FormControl(false);
}

describe('CheckboxComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render unchecked by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
            'input[type="checkbox"]',
        ) as HTMLInputElement;
        expect(input.checked).toBe(false);
    });

    it('should toggle when clicked', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
            'input[type="checkbox"]',
        ) as HTMLInputElement;
        input.click();
        expect(fixture.componentInstance.ctrl.value).toBe(true);
    });

    it('should reflect formControl value', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.setValue(true);
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
            'input[type="checkbox"]',
        ) as HTMLInputElement;
        expect(input.checked).toBe(true);
    });
});

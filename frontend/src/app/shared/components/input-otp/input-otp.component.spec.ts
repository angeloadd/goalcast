import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputOtpComponent } from './input-otp.component';

@Component({
    template: ` <fb-input-otp [formControl]="ctrl" [length]="6"></fb-input-otp>`,
    imports: [InputOtpComponent, ReactiveFormsModule],
})
class TestHostComponent {
    ctrl = new FormControl('');
}

describe('InputOtpComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    });

    it('should render correct number of input boxes', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const inputs = fixture.nativeElement.querySelectorAll(
            'input',
        ) as NodeListOf<HTMLInputElement>;
        expect(inputs.length).toBe(6);
    });

    it('should combine values into formControl', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const inputs = fixture.nativeElement.querySelectorAll(
            'input',
        ) as NodeListOf<HTMLInputElement>;
        for (let i = 0; i < 6; i++) {
            inputs[i].value = String(i + 1);
            inputs[i].dispatchEvent(new Event('input'));
        }
        expect(fixture.componentInstance.ctrl.value).toBe('123456');
    });

    it('should populate boxes from formControl value', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.setValue('ABC123');
        fixture.detectChanges();
        const inputs = fixture.nativeElement.querySelectorAll(
            'input',
        ) as NodeListOf<HTMLInputElement>;
        expect(inputs[0].value).toBe('A');
        expect(inputs[5].value).toBe('3');
    });
});

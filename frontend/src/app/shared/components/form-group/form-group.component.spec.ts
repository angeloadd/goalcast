import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroupComponent } from './form-group.component';

@Component({
    template: `
        <fb-form-group label="Email" description="We'll never share your email." [control]="ctrl">
            <input [formControl]="ctrl" />
        </fb-form-group>
    `,
    imports: [FormGroupComponent, ReactiveFormsModule],
})
class TestHostComponent {
    ctrl = new FormControl('', Validators.required);
}

describe('FormGroupComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render label', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const label = fixture.nativeElement.querySelector('label') as HTMLElement;
        expect(label.textContent).toContain('Email');
    });

    it('should render description', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const desc = fixture.nativeElement.querySelector('[data-description]') as HTMLElement;
        expect(desc.textContent).toContain('We\'ll never share your email.');
    });

    it('should show error when control is touched and invalid', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.markAsTouched();
        fixture.detectChanges();
        const error = fixture.nativeElement.querySelector('[data-error]') as HTMLElement;
        expect(error).toBeTruthy();
    });

    it('should not show error when control is valid', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.setValue('test@example.com');
        fixture.componentInstance.ctrl.markAsTouched();
        fixture.detectChanges();
        const error = fixture.nativeElement.querySelector('[data-error]') as HTMLElement;
        expect(error).toBeNull();
    });
});

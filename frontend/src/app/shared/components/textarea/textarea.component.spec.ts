import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextareaComponent } from './textarea.component';

@Component({
    template: ` <gc-textarea [formControl]="ctrl" placeholder="Enter text"></gc-textarea>`,
    imports: [TextareaComponent, ReactiveFormsModule],
})
class TestHostComponent {
    ctrl = new FormControl('');
}

describe('TextareaComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render a textarea element', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const textarea = fixture.nativeElement.querySelector('textarea');
        expect(textarea).toBeTruthy();
    });

    it('should bind value via formControl', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.setValue('Hello world');
        fixture.detectChanges();
        const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Hello world');
    });

    it('should emit changes to formControl', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
        textarea.value = 'New value';
        textarea.dispatchEvent(new Event('input'));
        expect(fixture.componentInstance.ctrl.value).toBe('New value');
    });
});

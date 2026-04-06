import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToggleComponent, ToggleGroupComponent, ToggleGroupItemComponent } from './toggle.component';

@Component({
    template: `
        <fb-toggle [(pressed)]="isPressed">Bold</fb-toggle>`,
    imports: [ToggleComponent],
})
class SingleToggleHost {
    isPressed = false;
}

@Component({
    template: `
        <fb-toggle-group type="single" [(value)]="selected">
            <fb-toggle-group-item value="a">A</fb-toggle-group-item>
            <fb-toggle-group-item value="b">B</fb-toggle-group-item>
        </fb-toggle-group>
    `,
    imports: [ToggleGroupComponent, ToggleGroupItemComponent],
})
class GroupToggleHost {
    selected = 'a';
}

describe('ToggleComponent', () => {
    it('should toggle pressed state on click', async () => {
        await TestBed.configureTestingModule({ imports: [SingleToggleHost] }).compileComponents();
        const fixture = TestBed.createComponent(SingleToggleHost);
        fixture.detectChanges();
        const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
        btn.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.isPressed).toBe(true);
        expect(btn.getAttribute('data-state')).toBe('on');
    });
});

describe('ToggleGroupComponent', () => {
    it('should select item on click', async () => {
        await TestBed.configureTestingModule({ imports: [GroupToggleHost] }).compileComponents();
        const fixture = TestBed.createComponent(GroupToggleHost);
        fixture.detectChanges();
        const items = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>;
        items[1].click();
        fixture.detectChanges();
        expect(fixture.componentInstance.selected).toBe('b');
    });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    SidebarComponent,
    SidebarContentComponent,
    SidebarFooterComponent,
    SidebarHeaderComponent,
    SidebarService,
} from './sidebar.component';

@Component({
    template: `
        <gc-sidebar>
            <gc-sidebar-header>Logo</gc-sidebar-header>
            <gc-sidebar-content>Nav items</gc-sidebar-content>
            <gc-sidebar-footer>User</gc-sidebar-footer>
        </gc-sidebar>
    `,
    imports: [
        SidebarComponent,
        SidebarHeaderComponent,
        SidebarContentComponent,
        SidebarFooterComponent,
    ],
})
class TestHostComponent {}

describe('SidebarComponent', () => {
    let sidebarService: SidebarService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [SidebarService],
        }).compileComponents();
        sidebarService = TestBed.inject(SidebarService);
    });

    it('should render sidebar with sub-components', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('gc-sidebar-header')?.textContent).toContain('Logo');
        expect(el.querySelector('gc-sidebar-content')?.textContent).toContain('Nav items');
        expect(el.querySelector('gc-sidebar-footer')?.textContent).toContain('User');
    });

    it('should toggle open state via service', () => {
        expect(sidebarService.isOpen()).toBe(true);
        sidebarService.toggle();
        expect(sidebarService.isOpen()).toBe(false);
        sidebarService.toggle();
        expect(sidebarService.isOpen()).toBe(true);
    });
});

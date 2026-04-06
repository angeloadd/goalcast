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
        <fb-sidebar>
            <fb-sidebar-header>Logo</fb-sidebar-header>
            <fb-sidebar-content>Nav items</fb-sidebar-content>
            <fb-sidebar-footer>User</fb-sidebar-footer>
        </fb-sidebar>
    `,
    imports: [
        SidebarComponent,
        SidebarHeaderComponent,
        SidebarContentComponent,
        SidebarFooterComponent,
    ],
})
class TestHostComponent {
}

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
        expect(el.querySelector('fb-sidebar-header')?.textContent).toContain('Logo');
        expect(el.querySelector('fb-sidebar-content')?.textContent).toContain('Nav items');
        expect(el.querySelector('fb-sidebar-footer')?.textContent).toContain('User');
    });

    it('should toggle open state via service', () => {
        expect(sidebarService.isOpen()).toBe(true);
        sidebarService.toggle();
        expect(sidebarService.isOpen()).toBe(false);
        sidebarService.toggle();
        expect(sidebarService.isOpen()).toBe(true);
    });
});

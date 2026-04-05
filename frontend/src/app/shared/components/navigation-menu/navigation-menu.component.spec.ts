import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {NavigationMenuComponent, NavigationMenuItemComponent, NavigationMenuTriggerComponent, NavigationMenuContentComponent, NavigationMenuLinkComponent} from './navigation-menu.component';

@Component({
  template: `
    <fb-navigation-menu>
      <fb-navigation-menu-item>
        <fb-navigation-menu-trigger>Features</fb-navigation-menu-trigger>
        <fb-navigation-menu-content>
          <fb-navigation-menu-link>Predictions</fb-navigation-menu-link>
          <fb-navigation-menu-link>Leagues</fb-navigation-menu-link>
        </fb-navigation-menu-content>
      </fb-navigation-menu-item>
      <fb-navigation-menu-item>
        <fb-navigation-menu-link>Pricing</fb-navigation-menu-link>
      </fb-navigation-menu-item>
    </fb-navigation-menu>
  `,
  imports: [NavigationMenuComponent, NavigationMenuItemComponent, NavigationMenuTriggerComponent, NavigationMenuContentComponent, NavigationMenuLinkComponent],
})
class TestHostComponent {}

describe('NavigationMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [TestHostComponent]}).compileComponents();
  });

  it('should render all menu items', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('fb-navigation-menu-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(2);
  });

  it('should hide content by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-navigation-menu-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(true);
  });

  it('should show content on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('fb-navigation-menu-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-navigation-menu-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(false);
  });
});

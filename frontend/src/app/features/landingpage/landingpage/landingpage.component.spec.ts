import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingpageComponent } from './landingpage.component';

describe('LandingpageComponent', () => {
    let fixture: ComponentFixture<LandingpageComponent>;
    let compiled: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LandingpageComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(LandingpageComponent);
        fixture.detectChanges();
        compiled = fixture.nativeElement as HTMLElement;
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render nav with GOALCAST branding', () => {
        const nav = compiled.querySelector('nav');
        expect(nav).toBeTruthy();
        expect(nav!.textContent).toContain('GOALCAST');
    });

    it('should render login and register links in nav', () => {
        const nav = compiled.querySelector('nav')!;
        const links = nav.querySelectorAll('a');
        const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('/login');
        expect(hrefs).toContain('/register');
    });

    it('should render hero headline', () => {
        const h1 = compiled.querySelector('h1');
        expect(h1).toBeTruthy();
        expect(h1!.textContent).toContain('Create. Predict.');
        expect(h1!.textContent).toContain('Compete.');
    });

    it('should render 4 feature cards', () => {
        const featureSection = compiled.querySelectorAll('.card-gradient');
        expect(featureSection.length).toBe(4);
    });

    it('should render feature titles', () => {
        const titles = Array.from(compiled.querySelectorAll('.card-gradient h3')).map((el) => el.textContent?.trim());
        expect(titles).toEqual(['Predict Results', 'Invite Friends', 'Bonus Predictions', 'Customize Your League']);
    });

    it('should render 4 how-it-works steps', () => {
        const stepNumbers = compiled.querySelectorAll('.text-accent\\/30');
        expect(stepNumbers.length).toBe(4);
    });

    it('should render CTA section with Ready headline', () => {
        const cta = compiled.querySelector('.bg-primary h2');
        expect(cta).toBeTruthy();
        expect(cta!.textContent).toContain('Ready?');
    });

    it('should render footer with copyright and legal links', () => {
        const footer = compiled.querySelector('footer');
        expect(footer).toBeTruthy();
        expect(footer!.textContent).toContain('2026 GoalCast');

        const footerLinks = Array.from(footer!.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(footerLinks).toContain('/terms');
        expect(footerLinks).toContain('/privacy');
        expect(footerLinks).toContain('/imprint');
    });
});

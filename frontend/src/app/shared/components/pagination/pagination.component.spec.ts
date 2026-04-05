import {TestBed} from '@angular/core/testing';
import {PaginationComponent} from './pagination.component';

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [PaginationComponent]}).compileComponents();
  });

  it('should render page numbers', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1');
    expect(el.textContent).toContain('5');
  });

  it('should disable previous button on first page', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();
    const prev = fixture.nativeElement.querySelector('[data-prev]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it('should emit pageChange on page click', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();
    let emittedPage = 0;
    fixture.componentInstance.pageChange.subscribe((p: number) => emittedPage = p);
    const next = fixture.nativeElement.querySelector('[data-next]') as HTMLButtonElement;
    next.click();
    expect(emittedPage).toBe(2);
  });
});

import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent} from './table.component';

@Component({
  template: `
    <fb-table>
      <fb-table-header>
        <fb-table-row>
          <fb-table-head>Name</fb-table-head>
          <fb-table-head>Points</fb-table-head>
        </fb-table-row>
      </fb-table-header>
      <fb-table-body>
        <fb-table-row>
          <fb-table-cell>Alice</fb-table-cell>
          <fb-table-cell>120</fb-table-cell>
        </fb-table-row>
      </fb-table-body>
    </fb-table>
  `,
  imports: [TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent],
})
class TestHostComponent {}

describe('TableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [TestHostComponent]}).compileComponents();
  });

  it('should render table with header and body', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('table')).toBeTruthy();
    expect(el.querySelector('thead')).toBeTruthy();
    expect(el.querySelector('tbody')).toBeTruthy();
  });

  it('should render cell content', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('120');
  });
});

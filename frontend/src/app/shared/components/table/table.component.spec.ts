import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    TableBodyComponent,
    TableCellComponent,
    TableComponent,
    TableHeadComponent,
    TableHeaderComponent,
    TableRowComponent,
} from './table.component';

@Component({
    template: `
        <gc-table>
            <gc-table-header>
                <gc-table-row>
                    <gc-table-head>Name</gc-table-head>
                    <gc-table-head>Points</gc-table-head>
                </gc-table-row>
            </gc-table-header>
            <gc-table-body>
                <gc-table-row>
                    <gc-table-cell>Alice</gc-table-cell>
                    <gc-table-cell>120</gc-table-cell>
                </gc-table-row>
            </gc-table-body>
        </gc-table>
    `,
    imports: [
        TableComponent,
        TableHeaderComponent,
        TableBodyComponent,
        TableRowComponent,
        TableHeadComponent,
        TableCellComponent,
    ],
})
class TestHostComponent {}

describe('TableComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
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

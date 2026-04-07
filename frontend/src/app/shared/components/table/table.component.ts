import { Component } from '@angular/core';

@Component({
    selector: 'gc-table',
    template: '<table class="w-full caption-bottom text-sm"><ng-content /></table>',
})
export class TableComponent {}

@Component({
    selector: 'gc-table-header',
    template: '<thead class="[&_tr]:border-b"><ng-content /></thead>',
})
export class TableHeaderComponent {}

@Component({
    selector: 'gc-table-body',
    template: '<tbody class="[&_tr:last-child]:border-0"><ng-content /></tbody>',
})
export class TableBodyComponent {}

@Component({
    selector: 'gc-table-row',
    template:
        '<tr class="border-b border-border transition-colors hover:bg-muted/50"><ng-content /></tr>',
})
export class TableRowComponent {}

@Component({
    selector: 'gc-table-head',
    template:
        '<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><ng-content /></th>',
})
export class TableHeadComponent {}

@Component({
    selector: 'gc-table-cell',
    template: '<td class="p-4 align-middle"><ng-content /></td>',
})
export class TableCellComponent {}

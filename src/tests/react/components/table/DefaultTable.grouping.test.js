import {
  flattenGroupedTableItems,
  getGroupingColumns,
  groupTableRows,
  toggleGroupSelection,
  toggleSelectedId,
} from '../../../../src/react/components/table/DefaultTable.grouping';

const columns = [
  { name: 'companyName', grouping: true },
  { name: 'addressLabel', grouping: true },
  { name: 'invoiceNumber' },
];

const rows = [
  { id: 1, companyName: 'A', addressLabel: 'Rua 1', invoiceNumber: 10 },
  { id: 2, companyName: 'A', addressLabel: 'Rua 1', invoiceNumber: 11 },
  { id: 3, companyName: 'B', addressLabel: 'Rua 2', invoiceNumber: 12 },
];

describe('DefaultTable grouping', () => {
  it('reads boolean grouping from store columns', () => {
    expect(getGroupingColumns(columns).map(column => column.name)).toEqual([
      'companyName',
      'addressLabel',
    ]);
  });

  it('groups rows by grouping columns', () => {
    const groups = groupTableRows(rows, columns);
    expect(groups).toHaveLength(2);
    expect(groups[0].count).toBe(2);
    expect(groups[1].count).toBe(1);
  });

  it('flattens group headers and rows', () => {
    const items = flattenGroupedTableItems(rows, columns);
    expect(items[0].type).toBe('group');
    expect(items.filter(item => item.type === 'row')).toHaveLength(3);
  });

  it('toggles row and group selection', () => {
    const one = toggleSelectedId([], rows[0]);
    expect(one).toEqual(['1']);
    const group = toggleGroupSelection(one, [rows[0], rows[1]]);
    expect(group).toEqual(['1', '2']);
    expect(toggleGroupSelection(group, [rows[0], rows[1]])).toEqual([]);
  });
});

import { getColumnKey } from '../inputs/defaultInputUtils';
import { getRowKey } from './DefaultTable.utils';

export const isGroupingColumn = column => column?.grouping === true;

export const getGroupingColumns = columns =>
  (Array.isArray(columns) ? columns : []).filter(isGroupingColumn);

export const getRowFieldValue = (row, column) => {
  const fieldName = typeof column === 'string' ? column : getColumnKey(column);
  if (!fieldName) return '';
  const value = row?.[fieldName];
  if (value && typeof value === 'object') {
    return String(value.label ?? value.name ?? value.alias ?? value.id ?? '').trim();
  }
  return String(value ?? '').trim();
};

export const buildGroupKey = (row, groupingColumns) =>
  getGroupingColumns(groupingColumns)
    .map(column => getRowFieldValue(row, column) || 'none')
    .join(':');

export const buildGroupLabel = (row, groupingColumns) =>
  getGroupingColumns(groupingColumns)
    .map(column => getRowFieldValue(row, column) || column?.label || getColumnKey(column))
    .filter(Boolean)
    .join(' · ');

export const groupTableRows = (rows, columns) => {
  const groupingColumns = getGroupingColumns(columns);
  const items = Array.isArray(rows) ? rows : [];
  if (!groupingColumns.length) {
    return [{ id: 'all', key: 'all', label: '', rows: items, count: items.length }];
  }
  const groups = new Map();
  items.forEach(row => {
    const key = buildGroupKey(row, groupingColumns);
    if (!groups.has(key)) {
      groups.set(key, { id: key, key, label: buildGroupLabel(row, groupingColumns), rows: [], count: 0 });
    }
    const group = groups.get(key);
    group.rows.push(row);
    group.count += 1;
  });
  return Array.from(groups.values());
};

export const flattenGroupedTableItems = (rows, columns) => {
  const groupingColumns = getGroupingColumns(columns);
  const items = Array.isArray(rows) ? rows : [];
  if (!groupingColumns.length) {
    return items.map((row, index) => ({ type: 'row', id: `row:${getRowKey(row, index)}`, row }));
  }
  return groupTableRows(items, groupingColumns).flatMap(group => [
    { type: 'group', id: `group:${group.id}`, group },
    ...group.rows.map((row, index) => ({ type: 'row', id: `row:${group.id}:${getRowKey(row, index)}`, group, row })),
  ]);
};

export const normalizeSelectedIds = selectedIds =>
  Array.from(new Set((Array.isArray(selectedIds) ? selectedIds : []).map(id => String(id))));

export const isRowSelected = (row, selectedIds, index = 0) =>
  normalizeSelectedIds(selectedIds).includes(String(getRowKey(row, index)));

export const toggleSelectedId = (selectedIds, row, index = 0) => {
  const current = normalizeSelectedIds(selectedIds);
  const id = String(getRowKey(row, index));
  return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
};

export const toggleGroupSelection = (selectedIds, groupRows) => {
  const current = normalizeSelectedIds(selectedIds);
  const ids = (Array.isArray(groupRows) ? groupRows : []).map(row => String(getRowKey(row)));
  const allSelected = ids.length > 0 && ids.every(id => current.includes(id));
  if (allSelected) return current.filter(id => !ids.includes(id));
  return normalizeSelectedIds([...current, ...ids]);
};

export const resolveStoreSelectedIds = (store, selectedIdsProp) => {
  if (Array.isArray(selectedIdsProp) && selectedIdsProp.length > 0) {
    return normalizeSelectedIds(selectedIdsProp);
  }
  return normalizeSelectedIds(store?.getters?.selected);
};

export const buildSelectionSummary = (rows, selectedIds, columns) => {
  const selected = normalizeSelectedIds(selectedIds);
  const items = (Array.isArray(rows) ? rows : []).filter(row => selected.includes(String(getRowKey(row))));
  const groups = groupTableRows(items, columns).filter(group => group.rows.length > 0);
  const totalValue = items.reduce((sum, row) => {
    const amount = Number(row?.invoiceTotal ?? row?.total ?? row?.value ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  return {
    count: { invoices: items.length, groups: groups.length },
    sum: { invoiceTotal: Number(totalValue.toFixed(2)) },
  };
};

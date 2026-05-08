import { getAllStores } from '@store';
import { formatStoreColumnValue } from '@controleonline/ui-common/src/react/utils/storeColumns';

export const normalizeText = value => String(value ?? '').trim();

export const getColumnKey = column => column?.key || column?.name || '';

export const normalizeId = value => {
  if (!value) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const match = value.match(/\d+/g);
    return match ? match[match.length - 1] : value;
  }
  return normalizeId(value?.id || value?.['@id'] || '');
};

export const isEditableColumn = column =>
  column?.editable !== false &&
  !column?.isIdentity &&
  column?.inputType !== 'increase' &&
  column?.inputType !== 'image' &&
  !String(getColumnKey(column)).includes('.');

export const normalizeOptionKey = option => {
  if (!option) return '';
  if (typeof option !== 'object') return normalizeId(option) || normalizeText(option);
  return normalizeText(
    option.value ??
      option.id ??
      normalizeId(option['@id']) ??
      option.key ??
      '',
  );
};

export const resolveOptionLabel = (column, option) => {
  if (!option) return '';

  if (typeof column?.formatList === 'function') {
    const formatted = column.formatList(option, null, column);
    if (formatted && typeof formatted === 'object') {
      return normalizeText(formatted.label ?? formatted.value);
    }
    if (formatted) return normalizeText(formatted);
  }

  return normalizeText(
    option.label ??
      option[column?.searchParam] ??
      option[column?.name] ??
      option.name ??
      option.status ??
      option.wallet ??
      option.paymentType ??
      option.alias ??
      option.id,
  );
};

export const resolveStoreNameFromList = list => normalizeText(list).split('/')[0] || '';

export const mapOptions = (column, items = []) =>
  (Array.isArray(items) ? items : []).map(item => ({
    key: normalizeOptionKey(
      typeof column?.formatList === 'function'
        ? column.formatList(item, null, column)
        : item,
    ) || normalizeOptionKey(item),
    label: resolveOptionLabel(column, item) || '-',
    raw: item,
  }));

export const buildOptionsFromColumn = (column, getOptionsForColumn = null) => {
  const explicitOptions = getOptionsForColumn?.(column);
  if (Array.isArray(explicitOptions) && explicitOptions.length > 0) {
    return mapOptions(column, explicitOptions);
  }

  const listStoreName = resolveStoreNameFromList(column?.list);
  if (!listStoreName) return [];

  const listStore = getAllStores()?.[listStoreName];
  return mapOptions(column, listStore?.getters?.items || []);
};

export const resolveCellText = ({ column, columns = [], row, storeName, value }) => {
  const fieldName = getColumnKey(column);
  const rawValue = value ?? row?.[fieldName];
  const formattedValue = formatStoreColumnValue({
    columns: columns.length ? columns : [column],
    fieldName,
    row,
    storeName,
    value: rawValue,
  });

  return normalizeText(formattedValue) || '-';
};

export const resolveEditValue = (column, row, value) => {
  const rawValue = value ?? row?.[getColumnKey(column)];
  if (column?.list) {
    return normalizeOptionKey(
      typeof column?.formatList === 'function'
        ? column.formatList(rawValue, row, column)
        : rawValue,
    );
  }

  if (typeof column?.editFormat === 'function') {
    return normalizeText(column.editFormat(rawValue, column, row, true));
  }

  return normalizeText(rawValue);
};

export const formatSaveValue = (column, value, row) => {
  if (typeof column?.saveFormat === 'function') {
    return column.saveFormat(value, column, row);
  }

  if (value && typeof value === 'object') {
    if (value.value) return Number.isNaN(Number(value.value)) ? value.value : Number(value.value);
    if (value['@id']) return value['@id'];
  }

  return Number.isNaN(Number(value)) || value === '' ? value : Number(value);
};

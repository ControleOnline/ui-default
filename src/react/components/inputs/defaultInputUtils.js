import { getAllStores } from '@store';
import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import { formatStoreColumnValue } from '@controleonline/ui-common/src/react/utils/storeColumns';

export const normalizeText = value => String(value ?? '').trim();
const formatHumanLabel = value =>
  normalizeText(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, letter => letter.toUpperCase());

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

export const resolveOptionLabel = (column, option, storeName = '') => {
  if (!option) return '';

  const translateOptionLabel = rawLabel => {
    const normalizedLabel = normalizeText(rawLabel);
    if (!normalizedLabel || !column?.translate || !normalizeText(storeName)) {
      return normalizedLabel;
    }

    const translated = global.t?.t(storeName, 'label', normalizedLabel) || normalizedLabel;
    return normalizeText(translated) === formatHumanLabel(normalizedLabel)
      ? normalizedLabel
      : translated;
  };

  if (typeof column?.formatList === 'function') {
    const formatted = column.formatList(option, null, column);
    if (formatted && typeof formatted === 'object') {
      return translateOptionLabel(formatted.label ?? formatted.value);
    }
    if (formatted) return translateOptionLabel(formatted);
  }

  const rawLabel = normalizeText(
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

  return translateOptionLabel(rawLabel);
};

export const resolveStoreNameFromList = list => normalizeText(list).split('/')[0] || '';

export const mapOptions = (column, items = [], storeName = '') =>
  (Array.isArray(items) ? items : []).map(item => ({
    key: normalizeOptionKey(
      typeof column?.formatList === 'function'
        ? column.formatList(item, null, column)
        : item,
    ) || normalizeOptionKey(item),
    label: resolveOptionLabel(column, item, storeName) || '-',
    raw: item,
  }));

export const buildOptionsFromColumn = (column, getOptionsForColumn = null, storeName = '') => {
  const explicitOptions = getOptionsForColumn?.(column);
  if (Array.isArray(explicitOptions) && explicitOptions.length > 0) {
    return mapOptions(column, explicitOptions, storeName);
  }

  const listStoreName = resolveStoreNameFromList(column?.list);
  if (!listStoreName) return [];

  const listStore = getAllStores()?.[listStoreName];
  return mapOptions(column, listStore?.getters?.items || [], storeName);
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

  if ((column?.inputType === 'date' || column?.inputType === 'date-range') && rawValue) {
    return normalizeText(Formatter.formatDateYmdTodmY(rawValue));
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

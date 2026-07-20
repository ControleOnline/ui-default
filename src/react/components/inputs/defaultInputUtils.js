import { getAllStores } from '@store';
import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import { formatStoreColumnValue } from '@controleonline/ui-common/src/react/utils/storeColumns';

export const normalizeText = value => String(value ?? '').trim();
const formatHumanLabel = value =>
  normalizeText(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, letter => letter.toUpperCase());
const DEFAULT_TRANSLATABLE_FIELDS = new Set([
  'active',
  'app',
  'channel',
  'displaytype',
  'featured',
  'frequency',
  'invoicetype',
  'installments',
  'ordertype',
  'peopletype',
  'pricecalculation',
  'productcondition',
  'realstatus',
  'status',
]);

export const getColumnKey = column => column?.key || column?.name || '';

export const isDateColumn = column =>
  column?.inputType === 'date' ||
  column?.type === 'date';

export const isDateRangeColumn = column =>
  column?.inputType === 'date-range' ||
  column?.type === 'range-date';

export const isDateLikeColumn = column =>
  isDateColumn(column) || isDateRangeColumn(column);

const normalizeColumnKey = value =>
  normalizeText(value)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const shouldTranslateOptionLabel = (column, storeName, rawLabel) => {
  if (column?.translate === false || !normalizeText(rawLabel) || !normalizeText(storeName)) {
    return false;
  }

  if (column?.translate === true || Array.isArray(column?.list)) {
    return true;
  }

  return [column?.key, column?.name, column?.label]
    .map(normalizeColumnKey)
    .filter(Boolean)
    .some(candidate => DEFAULT_TRANSLATABLE_FIELDS.has(candidate));
};

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
    if (!shouldTranslateOptionLabel(column, storeName, normalizedLabel)) {
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

const filterItemsByListRequestParams = (items = [], column = null) => {
  const requestParams =
    column?.listRequestParams &&
    typeof column.listRequestParams === 'object' &&
    !Array.isArray(column.listRequestParams)
      ? column.listRequestParams
      : null;

  if (!requestParams || Object.keys(requestParams).length === 0) {
    return Array.isArray(items) ? items : [];
  }

  return (Array.isArray(items) ? items : []).filter(item =>
    Object.entries(requestParams).every(([key, expectedValue]) => {
      if (expectedValue === undefined || expectedValue === null || expectedValue === '') {
        return true;
      }

      return normalizeText(item?.[key]) === normalizeText(expectedValue);
    }),
  );
};

export const mapOptions = (column, items = [], storeName = '') => {
  const seenKeys = new Set();
  const options = [];

  (Array.isArray(items) ? items : []).forEach(item => {
    const formatted =
      typeof column?.formatList === 'function'
        ? column.formatList(item, null, column)
        : item;
    const key = normalizeOptionKey(formatted) || normalizeOptionKey(item);
    const dedupeKey = key || normalizeText(resolveOptionLabel(column, item, storeName)).toLowerCase();

    if (dedupeKey && seenKeys.has(dedupeKey)) return;
    if (dedupeKey) seenKeys.add(dedupeKey);

    options.push({
      key,
      label: resolveOptionLabel(column, item, storeName) || '-',
      raw: item,
    });
  });

  return options;
};

export const buildOptionsFromColumn = (column, getOptionsForColumn = null, storeName = '') => {
  const explicitOptions = getOptionsForColumn?.(column);
  if (Array.isArray(explicitOptions) && explicitOptions.length > 0) {
    return mapOptions(column, explicitOptions, storeName);
  }

  const listStoreName = resolveStoreNameFromList(column?.list);
  if (!listStoreName) return [];

  const listStore = getAllStores()?.[listStoreName];
  return mapOptions(
    column,
    filterItemsByListRequestParams(listStore?.getters?.items || [], column),
    storeName,
  );
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

  if (isDateLikeColumn(column) && rawValue) {
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

  if (isDateLikeColumn(column) && value) {
    const normalizedDate = Formatter.buildAmericanDate(String(value));
    return normalizedDate || value;
  }

  return Number.isNaN(Number(value)) || value === '' ? value : Number(value);
};

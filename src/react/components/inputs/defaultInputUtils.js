import { getAllStores } from '@store';
import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import { formatStoreColumnValue } from '@controleonline/ui-common/src/react/utils/storeColumns';
import FeatherGlyphMap from 'react-native-vector-icons/glyphmaps/Feather.json';

export const normalizeText = value => String(value ?? '').trim();
export const isValidFeatherIcon = icon => Boolean(FeatherGlyphMap[normalizeText(icon)]);
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

export const resolveStoreNameFromList = list =>
  typeof list === 'string' ? normalizeText(list).split('/')[0] || '' : '';

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

const normalizeObject = value =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

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

    const formattedMeta = normalizeObject(formatted);
    const itemMeta = normalizeObject(item);
    const color = formattedMeta.color ?? itemMeta.color;
    const icon =
      formattedMeta.icon ??
      formattedMeta.iconName ??
      itemMeta.icon ??
      itemMeta.iconName;
    const image =
      formattedMeta.image ??
      formattedMeta.logo ??
      formattedMeta.source ??
      itemMeta.image ??
      itemMeta.logo ??
      itemMeta.source;

    options.push({
      ...(color ? { color } : {}),
      ...(icon ? { icon } : {}),
      ...(image ? { image } : {}),
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

  if (Array.isArray(column?.list)) {
    return mapOptions(column, column.list, storeName);
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

const resolveFormattedListMeta = (column, rawValue, row) => {
  if (typeof column?.formatList !== 'function') {
    return {};
  }

  const formatted = column.formatList(rawValue, row, column);
  return normalizeObject(formatted);
};

const resolveFormattedValueMeta = (column, rawValue, row) => {
  if (typeof column?.format !== 'function') {
    return {};
  }

  const formatted = column.format(rawValue, column, row, false);
  return normalizeObject(formatted);
};

const resolveStyleMeta = (column, row) => {
  if (typeof column?.style !== 'function') {
    return normalizeObject(column?.style);
  }

  return normalizeObject(column.style(row));
};

export const resolveCellPresentation = ({
  column,
  columns = [],
  row = {},
  storeName = '',
  value,
} = {}) => {
  const fieldName = getColumnKey(column);
  const rawValue = value ?? row?.[fieldName];
  const rawMeta = normalizeObject(rawValue);
  const formattedValueMeta = resolveFormattedValueMeta(column, rawValue, row);
  const formattedMeta = resolveFormattedListMeta(column, rawValue, row);
  const styleMeta = resolveStyleMeta(column, row);
  const label = resolveCellText({
    column,
    columns,
    row,
    storeName,
    value,
  });

  return {
    backgroundColor:
      formattedValueMeta.backgroundColor ??
      formattedMeta.backgroundColor ??
      formattedValueMeta.bgColor ??
      formattedMeta.bgColor ??
      rawMeta.backgroundColor ??
      rawMeta.bgColor ??
      styleMeta.backgroundColor ??
      styleMeta.bgColor,
    borderColor:
      formattedValueMeta.borderColor ??
      formattedMeta.borderColor ??
      rawMeta.borderColor ??
      styleMeta.borderColor,
    color:
      formattedValueMeta.color ??
      formattedMeta.color ??
      rawMeta.color ??
      rawMeta.statusColor ??
      rawMeta.categoryColor ??
      styleMeta.color,
    icon:
      formattedValueMeta.icon ??
      formattedValueMeta.iconName ??
      formattedMeta.icon ??
      formattedMeta.iconName ??
      rawMeta.icon ??
      rawMeta.iconName ??
      styleMeta.icon ??
      styleMeta.iconName,
    image:
      formattedValueMeta.image ??
      formattedValueMeta.logo ??
      formattedValueMeta.source ??
      formattedMeta.image ??
      formattedMeta.logo ??
      formattedMeta.source ??
      rawMeta.image ??
      rawMeta.logo ??
      rawMeta.source ??
      styleMeta.image ??
      styleMeta.logo ??
      styleMeta.source,
    label,
  };
};

const resolveAlphaColor = (color, opacity = 0.12) => {
  const normalized = normalizeText(color);
  const hex = normalized.match(/^#?([a-f\d]{6})$/i)?.[1];

  if (!hex) return normalized || undefined;

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

export const buildReadPresentationStyles = presentation => {
  const color = normalizeText(presentation?.color);
  const icon = normalizeText(presentation?.icon);
  const hasDecoration = Boolean(
    color ||
    normalizeText(presentation?.backgroundColor) ||
    normalizeText(presentation?.borderColor) ||
    (icon && color),
  );

  if (!hasDecoration || presentation?.label === '-') {
    return {
      badgeStyle: null,
      color: null,
      hasDecoration: false,
    };
  }

  const backgroundColor =
    presentation.backgroundColor ||
    (color ? resolveAlphaColor(color, 0.1) : undefined);
  const borderColor =
    presentation.borderColor ||
    presentation.backgroundColor ||
    (color ? resolveAlphaColor(color, 0.32) : undefined);

  return {
    badgeStyle: {
      backgroundColor,
      borderColor,
    },
    color: color || undefined,
    hasDecoration: true,
  };
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

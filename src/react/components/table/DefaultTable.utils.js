import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import { getDateRange } from '@controleonline/ui-common/src/react/utils/dateRangeFilter';
import {
  getColumnKey,
  isDateLikeColumn,
  normalizeText,
  resolveCellText,
  resolveStoreNameFromList,
} from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';

export const DEFAULT_CELL_MIN_WIDTH = 118;
export const DEFAULT_COMPACT_BREAKPOINT = 768;
export const COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH = 400;
export const COLLAPSED_SEARCH_MAX_CONTAINER_WIDTH = 350;
export const END_REACHED_THRESHOLD = 0.75;
export const IDENTITY_CELL_MIN_WIDTH = 76;
export const MONEY_CELL_MIN_WIDTH = 132;
export const ACTIONS_CELL_WIDTH = 60;

const SUMMARY_OPERATIONS = ['sum', 'count', 'avg', 'min', 'max'];
const COMPANY_SCOPED_LIST_STORES = new Set([
  'categories',
  'paymentType',
  'wallet',
]);

export const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.show !== false &&
  column?.visible !== false &&
  column?.table !== false;

export const resolveListActionName = list =>
  normalizeText(list).split('/')[1] || 'getItems';

const resolveListLoadParams = ({ currentCompanyId, listStoreName }) => {
  if (!currentCompanyId || !COMPANY_SCOPED_LIST_STORES.has(listStoreName)) {
    return {};
  }

  return listStoreName === 'categories'
    ? { company: currentCompanyId }
    : { people: currentCompanyId };
};

export const resolveColumnListLoadParams = ({
  column,
  currentCompanyId,
  requestParams = {},
  searchValue = '',
}) => {
  const listStoreName = resolveStoreNameFromList(column?.list);
  const companyScopedParams = resolveListLoadParams({
    currentCompanyId,
    listStoreName,
  });
  const resolvedCustomParams = typeof column?.listRequestParams === 'function'
    ? column.listRequestParams({ currentCompanyId, requestParams })
    : column?.listRequestParams;
  const customParams =
    resolvedCustomParams &&
    typeof resolvedCustomParams === 'object' &&
    !Array.isArray(resolvedCustomParams)
      ? resolvedCustomParams
      : {};

  return {
    ...companyScopedParams,
    ...customParams,
    ...(normalizeText(searchValue)
      ? { [column?.listSearchParam || column?.searchParam || 'search']: normalizeText(searchValue) }
      : {}),
  };
};

export const isObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const getRowKey = (row, index = 0) =>
  String(row?.['@id'] || row?.id || index);

export const shouldTriggerEndReachedFromScroll = event => {
  const nativeEvent = event?.nativeEvent || {};
  const viewportHeight = Number(nativeEvent.layoutMeasurement?.height);
  const contentOffsetY = Number(nativeEvent.contentOffset?.y);
  const contentHeight = Number(nativeEvent.contentSize?.height);

  if (
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(contentOffsetY) ||
    !Number.isFinite(contentHeight) ||
    viewportHeight <= 0 ||
    contentHeight <= viewportHeight
  ) {
    return false;
  }

  const distanceFromEnd = contentHeight - (contentOffsetY + viewportHeight);

  return distanceFromEnd <= viewportHeight * END_REACHED_THRESHOLD;
};

const normalizeRowIdentity = row => {
  const rawId = row?.['@id'] || row?.id;
  if (rawId === null || rawId === undefined || rawId === '') {
    return '';
  }

  return normalizeText(rawId).replace(/\D+/g, '');
};

export const mergeSortedDataWithLiveItems = ({ liveItems = [], sortedData = [] }) => {
  const resolvedSortedData = Array.isArray(sortedData) ? sortedData : [];
  const resolvedLiveItems = Array.isArray(liveItems) ? liveItems : [];

  if (resolvedLiveItems.length === 0) {
    return resolvedSortedData;
  }

  if (resolvedSortedData.length === 0) {
    return resolvedLiveItems;
  }

  const liveItemsById = new Map();
  resolvedLiveItems.forEach(item => {
    const itemId = normalizeRowIdentity(item);
    if (itemId) {
      liveItemsById.set(itemId, item);
    }
  });

  if (liveItemsById.size === 0) {
    return resolvedSortedData;
  }

  return resolvedSortedData.map(item => {
    const itemId = normalizeRowIdentity(item);
    const liveItem = itemId ? liveItemsById.get(itemId) : null;

    if (!liveItem) {
      return item;
    }

    return liveItem;
  });
};

export const stableSerialize = value => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableSerialize(item)).join(',')}]`;
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

export const resolveDateRangeQuery = value => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const shortcut = value.shortcut || value.value || 'all';
  const customRange = value.customRange || { from: '', to: '' };
  const dateRange = getDateRange(shortcut, customRange, {
    relativeMode: 'rolling',
    useCurrentMoment: true,
  });

  return {
    after: dateRange?.after || '',
    before: dateRange?.before || '',
  };
};

export const resolveFilterQueryValue = value => {
  if (Array.isArray(value)) {
    return value
      .map(item => resolveFilterQueryValue(item))
      .filter(item => item !== '' && item !== null && item !== undefined);
  }

  if (value && typeof value === 'object') {
    return resolveFilterQueryValue(
      value.value ?? value.id ?? value['@id'] ?? value.key ?? '',
    );
  }

  return normalizeText(value);
};

export const normalizeCollectionItems = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];

  return [];
};

export const resolveHasMore = ({ hasMore, dataLength, totalItems }) => {
  if (hasMore !== null && hasMore !== undefined) {
    return hasMore;
  }

  const resolvedTotalItems = Number(totalItems);
  if (!Number.isFinite(resolvedTotalItems)) {
    return false;
  }

  return dataLength < resolvedTotalItems;
};

const humanizeSummaryLabel = value =>
  normalizeText(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isMoneySummaryPath = path =>
  /(amount|price|total|value|paid|open|receivable|payable|pending)/i.test(
    Array.isArray(path) ? path.join('.') : normalizeText(path),
  );

const normalizeSummaryMoneyValue = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const rawValue = normalizeText(value).replace(/[^0-9,.-]/g, '');
  if (!rawValue) return 0;

  const normalizedValue = rawValue.includes(',')
    ? rawValue.replace(/\./g, '').replace(',', '.')
    : rawValue;
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const getSummaryOperations = column => {
  if (typeof column?.summary === 'string') return [column.summary];
  if (Array.isArray(column?.summary)) return column.summary;
  if (isObject(column?.summary)) {
    return Object.entries(column.summary)
      .filter(([, value]) => value)
      .map(([operation]) => operation);
  }

  return SUMMARY_OPERATIONS.filter(operation => column?.[operation] === true);
};

export const getSummaryField = (column, operation) => {
  if (isObject(column?.summary)) {
    const summaryField = column.summary[operation];
    if (typeof summaryField === 'string') return summaryField;
  }

  return getColumnKey(column);
};

export const formatSummaryValue = ({ column, columns, path, storeName, value }) => {
  const columnKey = column ? getColumnKey(column) : '';
  const shouldFormatMoney = isMoneySummaryPath(path) || isMoneySummaryPath(columnKey);

  if (shouldFormatMoney) {
    return Formatter.formatMoney(normalizeSummaryMoneyValue(value));
  }

  if (column) {
    return resolveCellText({
      column,
      columns,
      row: { [columnKey]: value },
      storeName,
      value,
    });
  }

  return normalizeText(value);
};

export const flattenSummaryEntries = ({
  path = [],
  summaryLabels = {},
  usedPaths,
  value,
}) => {
  if (!isObject(value)) {
    const pathKey = path.join('.');
    if (!pathKey || usedPaths.has(pathKey)) return [];

    const fallbackLabel = humanizeSummaryLabel(path[path.length - 1] || pathKey);

    return [{
      key: pathKey,
      label: summaryLabels[pathKey] || summaryLabels[path[path.length - 1]] || fallbackLabel,
      path,
      value,
    }];
  }

  return Object.entries(value).flatMap(([key, childValue]) =>
    flattenSummaryEntries({
      path: [...path, key],
      summaryLabels,
      usedPaths,
      value: childValue,
    }),
  );
};

export const isSortableColumn = column => column?.sortable === true;

export const getSortField = column => column?.sortField || getColumnKey(column);

export const resolveDefaultSort = columns => {
  if (!Array.isArray(columns)) {
    return null;
  }

  for (const column of columns) {
    if (!column || column?.defaultSort === undefined || column?.defaultSort === null || column?.defaultSort === false) {
      continue;
    }

    const field = getSortField(column);
    const defaultSort = column.defaultSort;

    if (defaultSort && typeof defaultSort === 'object' && !Array.isArray(defaultSort)) {
      const resolvedDirection = normalizeText(defaultSort.direction || defaultSort.order || 'desc').toLowerCase();
      const resolvedField = normalizeText(
        defaultSort.field || defaultSort.sortField || defaultSort.key || defaultSort.name || field,
      );

      return {
        direction: resolvedDirection === 'asc' ? 'asc' : 'desc',
        field: resolvedField || field,
      };
    }

    if (typeof defaultSort === 'string') {
      const normalizedSort = normalizeText(defaultSort).toLowerCase();
      if (normalizedSort === 'asc' || normalizedSort === 'desc') {
        return {
          direction: normalizedSort,
          field,
        };
      }

      return {
        direction: 'desc',
        field: normalizeText(defaultSort) || field,
      };
    }

    if (defaultSort === true) {
      return {
        direction: 'asc',
        field,
      };
    }
  }

  return null;
};

export const sanitizeStoredSortPreference = ({
  columns = [],
  fallbackSort = null,
  sort = null,
}) => {
  const normalizedFallback =
    fallbackSort &&
    typeof fallbackSort === 'object' &&
    typeof fallbackSort.field === 'string' &&
    fallbackSort.field.trim()
      ? {
          direction: fallbackSort.direction === 'asc' ? 'asc' : 'desc',
          field: fallbackSort.field.trim(),
        }
      : null;

  if (
    !sort ||
    typeof sort !== 'object' ||
    typeof sort.field !== 'string' ||
    !sort.field.trim()
  ) {
    return normalizedFallback;
  }

  const normalizedDirection = sort.direction === 'asc' ? 'asc' : 'desc';
  const normalizedField = sort.field.trim();
  const sortableFields = new Set(
    (Array.isArray(columns) ? columns : [])
      .filter(isSortableColumn)
      .map(column => getSortField(column))
      .filter(Boolean),
  );

  if (!sortableFields.has(normalizedField)) {
    return normalizedFallback;
  }

  return {
    direction: normalizedDirection,
    field: normalizedField,
  };
};

const readValueByPath = (object, path) => {
  if (!object || !path) return object;

  return String(path)
    .split('.')
    .reduce((currentValue, key) => {
      if (currentValue === null || currentValue === undefined) return currentValue;
      return currentValue?.[key];
    }, object);
};

export const normalizeSortText = value =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const resolveSortComparable = ({ column, row, storeName, columns }) => {
  const fieldName = getColumnKey(column);
  const sortField = getSortField(column);
  const rawValue = sortField === fieldName ? row?.[fieldName] : readValueByPath(row, sortField);

  if (isDateLikeColumn(column)) {
    const dateValue =
      rawValue && typeof rawValue === 'object'
        ? rawValue?.value ??
          rawValue?.date ??
          rawValue?.createdAt ??
          rawValue?.updatedAt ??
          rawValue?.['@id'] ??
          rawValue?.[fieldName] ??
          rawValue
        : rawValue;
    const parsedDate = Date.parse(dateValue);
    return Number.isFinite(parsedDate) ? parsedDate : Number.NEGATIVE_INFINITY;
  }

  const resolvedValue = sortField === fieldName
    ? resolveCellText({
        column,
        columns,
        row,
        storeName,
      })
    : normalizeText(rawValue ?? resolveCellText({
        column,
        columns,
        row,
        storeName,
      }));

  const normalizedNumber = Number(
    String(resolvedValue).replace(/[^0-9,.-]/g, '').replace(',', '.'),
  );

  if (Number.isFinite(normalizedNumber) && String(resolvedValue).match(/[0-9]/)) {
    return normalizedNumber;
  }

  return normalizeSortText(resolvedValue);
};

export const getColumnStyle = column => {
  const key = getColumnKey(column);
  if (column?.isIdentity) return [styles.cell, styles.identityCell];
  if (['price', 'total', 'amount', 'value'].includes(key)) {
    return [styles.cell, styles.moneyCell];
  }
  return styles.cell;
};

export const getColumnMinWidth = column => {
  const key = getColumnKey(column);
  if (column?.isIdentity) return IDENTITY_CELL_MIN_WIDTH;
  if (['price', 'total', 'amount', 'value'].includes(key)) {
    return MONEY_CELL_MIN_WIDTH;
  }
  return DEFAULT_CELL_MIN_WIDTH;
};

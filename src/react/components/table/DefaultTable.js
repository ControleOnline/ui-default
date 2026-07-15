/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { getAllStores, useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import StateStore from '@controleonline/ui-layout/src/react/components/StateStore';
import { getDateRange } from '@controleonline/ui-common/src/react/utils/dateRangeFilter';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { resolveThemePalette } from '@controleonline/../../src/styles/branding';
import { colors } from '@controleonline/../../src/styles/colors';
import DefaultColumnFilter from '../filters/DefaultColumnFilter';
import DefaultSearch from '../filters/DefaultSearch';
import DefaultForm from '../form/DefaultForm';
import DefaultInput from '../inputs/DefaultInput';
import {
  formatSaveValue,
  getColumnKey,
  isEditableColumn,
  normalizeId,
  normalizeOptionKey,
  normalizeText,
  resolveStoreNameFromList,
  resolveCellText,
  resolveEditValue,
} from '../inputs/defaultInputUtils';
import {
  persistTableSortPreference,
  persistTableViewModePreference,
  persistVisibleColumnsPreference,
  resolveStoredTableSortPreference,
  resolveStoredTableViewModePreference,
  resolveStoredVisibleColumnsPreference,
  sanitizeVisibleColumnsPreference,
} from '../../utils/tableVisibleColumnsPreferences';
import styles from './DefaultTable.styles';

const DEFAULT_CELL_MIN_WIDTH = 118;
const DEFAULT_COMPACT_BREAKPOINT = 768;
const END_REACHED_THRESHOLD = 0.35;
const IDENTITY_CELL_MIN_WIDTH = 76;
const MONEY_CELL_MIN_WIDTH = 132;
const ACTIONS_CELL_WIDTH = 60;
const SUMMARY_OPERATIONS = ['sum', 'count', 'avg', 'min', 'max'];
const LIST_OPTIONS_PAGE_SIZE = 100;

const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.show !== false &&
  column?.visible !== false &&
  column?.table !== false;

const resolveListActionName = list =>
  normalizeText(list).split('/')[1] || 'getItems';

const COMPANY_SCOPED_LIST_STORES = new Set([
  'categories',
  'paymentType',
  'wallet',
]);

const resolveListLoadParams = ({currentCompanyId, listStoreName}) => {
  if (!currentCompanyId || !COMPANY_SCOPED_LIST_STORES.has(listStoreName)) {
    return {};
  }

  return listStoreName === 'categories'
    ? {company: currentCompanyId}
    : {people: currentCompanyId};
};

export const resolveColumnListLoadParams = ({
  column,
  currentCompanyId,
  requestParams = {},
}) => {
  const listStoreName = resolveStoreNameFromList(column?.list);
  const companyScopedParams = resolveListLoadParams({
    currentCompanyId,
    listStoreName,
  });
  const resolvedCustomParams = typeof column?.listRequestParams === 'function'
    ? column.listRequestParams({currentCompanyId, requestParams})
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
  };
};

const isObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getRowKey = (row, index = 0) =>
  String(row?.['@id'] || row?.id || index);

const stableSerialize = value => {
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

const resolveDateRangeQuery = value => {
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

const resolveFilterQueryValue = value => {
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

const normalizeCollectionItems = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];

  return [];
};

const resolveHasMore = ({ hasMore, dataLength, totalItems }) => {
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

const getSummaryOperations = column => {
  if (typeof column?.summary === 'string') return [column.summary];
  if (Array.isArray(column?.summary)) return column.summary;
  if (isObject(column?.summary)) {
    return Object.entries(column.summary)
      .filter(([, value]) => value)
      .map(([operation]) => operation);
  }

  return SUMMARY_OPERATIONS.filter(operation => column?.[operation] === true);
};

const getSummaryField = (column, operation) => {
  if (isObject(column?.summary)) {
    const summaryField = column.summary[operation];
    if (typeof summaryField === 'string') return summaryField;
  }

  return getColumnKey(column);
};

const formatSummaryValue = ({ column, columns, path, storeName, value }) => {
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

const flattenSummaryEntries = ({
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

const isSortableColumn = column => column?.sortable === true;

const getSortField = column => column?.sortField || getColumnKey(column);

const resolveDefaultSort = columns => {
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

const sanitizeStoredSortPreference = ({
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

const normalizeSortText = value =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isDateLikeColumn = column =>
  column?.inputType === 'date' ||
  column?.inputType === 'date-range' ||
  column?.type === 'date' ||
  column?.type === 'range-date' ||
  /date/i.test(getColumnKey(column));

const resolveSortComparable = ({ column, row, storeName, columns }) => {
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

const getColumnStyle = column => {
  const key = getColumnKey(column);
  if (column?.isIdentity) return [styles.cell, styles.identityCell];
  if (['price', 'total', 'amount', 'value'].includes(key)) {
    return [styles.cell, styles.moneyCell];
  }
  return styles.cell;
};

const getColumnMinWidth = column => {
  const key = getColumnKey(column);
  if (column?.isIdentity) return IDENTITY_CELL_MIN_WIDTH;
  if (['price', 'total', 'amount', 'value'].includes(key)) {
    return MONEY_CELL_MIN_WIDTH;
  }
  return DEFAULT_CELL_MIN_WIDTH;
};

const DefaultTable = ({
  accentColor = null,
  actions = {},
  add = null,
  compactBreakpoint = DEFAULT_COMPACT_BREAKPOINT,
  columns = [],
  data = undefined,
  filters = {},
  forceCardsOnCompact = true,
  getOptionsForColumn = null,
  hasMore = null,
  initialViewMode = 'table',
  pageSize = null,
  isLoading = false,
  onEditRow = null,
  onEndReached = null,
  onMomentumScrollBegin = null,
  onScrollBeginDrag = null,
  onAdd = null,
  onFilterChange = null,
  onRowPress = null,
  onSaved = null,
  onSortChange = null,
  onDataLoaded = null,
  requestParams = {},
  renderCard = null,
  searchProps = null,
  toolbarActions = [],
  showColumnFiltersButton = true,
  showTotalItemsInFooter = true,
  showTotalItemsInCompactToolbar = false,
  showRowActions = true,
  rowStyle = null,
  sort = null,
  storeName = '',
  summary = null,
  summaryLabels = null,
  totalItems = null,
  totalItemsLabel = null,
  totalItemsText = null,
  footerComponent = null,
  visibleColumnsPreferenceKey = '',
}) => {
  const { width } = useWindowDimensions();
  const store = useStore(storeName);
  const visibleColumnsStorageKey = visibleColumnsPreferenceKey || storeName;
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const [editingCell, setEditingCell] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formMode, setFormMode] = useState('edit');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [listOptionsByColumn, setListOptionsByColumn] = useState({});
  const [savingCell, setSavingCell] = useState(null);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);
  const endReachedLockRef = useRef(false);
  const loadedListStoresRef = useRef(new Set());
  const previousPaginationStateRef = useRef({
    dataLength: Array.isArray(data) ? data.length : 0,
    filtersKey: JSON.stringify(filters || {}),
    sortDirection: sort?.direction,
    sortField: sort?.field,
  });
  const visibleColumnsSeed = useMemo(
    () =>
      sanitizeVisibleColumnsPreference({
        columns: Array.isArray(store?.getters?.columns) && store.getters.columns.length > 0
          ? store.getters.columns
          : columns,
        visibleColumns: resolveStoredVisibleColumnsPreference(
          visibleColumnsStorageKey,
        ),
      }),
    [columns, store?.getters?.columns, visibleColumnsStorageKey],
  );
  const viewModeSeed = useMemo(
    () =>
      resolveStoredTableViewModePreference(
        visibleColumnsPreferenceKey,
        initialViewMode,
      ),
    [initialViewMode, visibleColumnsPreferenceKey],
  );
  const [visibleColumns, setVisibleColumns] = useState(() => visibleColumnsSeed);
  const [viewMode, setViewMode] = useState(() => viewModeSeed);
  const [compactViewMode, setCompactViewMode] = useState(null);
  const { currentCompany } = peopleStore.getters || {};
  const { colors: themeColors } = themeStore.getters;
  const themeTokens = useMemo(
    () => ({...themeColors, ...(currentCompany?.theme?.colors || {})}),
    [currentCompany?.theme?.colors, themeColors],
  );
  const palette = useMemo(
    () => resolveThemePalette(themeTokens, colors),
    [themeTokens],
  );
  const resolvedAccentColor = accentColor || palette.primary;
  const tableHeaderColor = themeTokens['bg-headers-light'] || resolvedAccentColor;
  const tableEvenColor = themeTokens.listItemEvenRow || themeTokens['bg-even-light'] || palette.background;
  const tableOddColor = themeTokens.listItemOddRow || themeTokens['bg-odd-light'] || palette.background;
  const tableBorderColor = palette.border;
  const tableSurfaceColor = palette.background;
  const tableTextColor = palette.text;
  const tableMutedColor = palette.textSecondary;
  const panelBackgroundColor = themeColors.panelBackground;
  const panelBorderColor = themeColors.panelBorder;
  const modalBackgroundColor = themeColors.modalBackground;
  const modalBorderColor = themeColors.modalBorder;
  const modalCloseIconColor = themeColors.modalCloseIcon;
  const modalHeaderTextColor = themeColors.modalHeaderText;
  const modalOverlayColor = themeColors.modalOverlay;
  const modalTextColor = themeColors.modalText;
  const checkboxBorderColor = themeColors.checkboxBorder;
  const checkboxSelectedMarkColor = themeColors.checkboxSelectedMark;
  const toolbarBackgroundColor = themeColors.toolbarBackground;
  const toolbarBorderColor = themeColors.toolbarBorder;
  const toolbarCountBackgroundColor = themeColors.badgeBackground;
  const toolbarCountTextColor = themeColors.badgeText;
  const tableActionBackgroundColor = themeColors.tableActionBackground;
  const tableActionBorderColor = themeColors.tableActionBorder;
  const tableActionTextColor = themeColors.tableActionIcon;
  const tableButtonBackgroundColor = themeColors.buttonBackground;
  const tableButtonBorderColor = themeColors.buttonBorder;
  const tableButtonIconColor = themeColors.buttonIcon;
  const tableButtonPressedBackgroundColor = themeColors.buttonPressedBackground;
  const tableButtonPressedBorderColor = themeColors.buttonPressedBorder;
  const tableButtonPressedIconColor = themeColors.buttonPressedIcon;
  const tableButtonTextColor = themeColors.buttonText;
  const tableFilterBackgroundColor = themeColors.tableFilterBackground;
  const tableFilterBorderColor = themeColors.tableFilterBorder;
  const tableFilterTextColor = themeColors.tableFilterText;
  const isFocused = useIsFocused();
  const {showError} = useMessage() || {};
  const autoMode = data === undefined && normalizeText(storeName) !== '';
  const searchKey = searchProps?.searchKey || 'search';
  const storeActions = store?.actions || {};
  const resolvedActions = useMemo(
    () => ({
      ...storeActions,
      ...(actions || {}),
    }),
    [actions, storeActions],
  );
  const storeColumns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const columnsForTable = storeColumns.length > 0 ? storeColumns : columns;
  const storeFilters = isObject(store?.getters?.filters) ? store.getters.filters : {};
  const requestParamsSeed = isObject(requestParams) ? requestParams : {};
  const initialFiltersSeed = autoMode
    ? (Object.keys(filters || {}).length > 0 ? filters : storeFilters)
    : (isObject(filters) ? filters : {});
  const [autoFilters, setAutoFilters] = useState(() => initialFiltersSeed);
  const defaultSortSeed = useMemo(
    () => resolveDefaultSort(columnsForTable),
    [columnsForTable],
  );
  const storedSortSeed = useMemo(
    () =>
      sanitizeStoredSortPreference({
        columns: columnsForTable,
        fallbackSort: sort || defaultSortSeed || null,
        sort: resolveStoredTableSortPreference(visibleColumnsPreferenceKey),
      }),
    [columnsForTable, defaultSortSeed, sort, visibleColumnsPreferenceKey],
  );
  const [autoSort, setAutoSort] = useState(() => storedSortSeed);
  const [autoHasLoaded, setAutoHasLoaded] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoLoadingMore, setAutoLoadingMore] = useState(false);
  const [autoLastPageCount, setAutoLastPageCount] = useState(0);
  const autoRequestIdRef = useRef(0);
  const autoLoadedQueryKeyRef = useRef('');
  const autoErroredQueryKeyRef = useRef('');
  const autoPageRef = useRef(0);
  const pageSizeNumber = Number(requestParamsSeed.itemsPerPage || pageSize || 50) || 50;
  const resolvedSort = autoMode ? autoSort : sort;
  const resolvedFilters = autoMode ? autoFilters : (filters || {});
  const resolvedSearchValue = normalizeText(resolvedFilters?.[searchKey]);
  const resolvedGetOptionsForColumn = useCallback(
    column => {
      const explicitOptions = getOptionsForColumn?.(column);
      if (Array.isArray(explicitOptions)) return explicitOptions;

      const columnKey = getColumnKey(column);
      return Array.isArray(listOptionsByColumn[columnKey])
        ? listOptionsByColumn[columnKey]
        : undefined;
    },
    [getOptionsForColumn, listOptionsByColumn],
  );

  useEffect(() => {
    setListOptionsByColumn({});
    loadedListStoresRef.current.clear();
  }, [currentCompany?.id]);

  const loadListOptionsForColumns = useCallback(
    (targetColumns = []) => {
      const columnsToLoad = (Array.isArray(targetColumns) ? targetColumns : []).filter(
        column => normalizeText(column?.list),
      );

      if (columnsToLoad.length === 0) {
        return Promise.resolve([]);
      }

      const stores = getAllStores?.() || {};
      const loadPromises = [];

      columnsToLoad.forEach(column => {
        const explicitOptions = getOptionsForColumn?.(column);
        if (Array.isArray(explicitOptions)) {
          return;
        }

        const listStoreName = resolveStoreNameFromList(column.list);
        const actionName = resolveListActionName(column.list);
        const listStore = stores?.[listStoreName];
        const listAction = listStore?.actions?.[actionName];

        const listLoadParams = resolveColumnListLoadParams({
          column,
          currentCompanyId: currentCompany?.id,
          requestParams: requestParamsSeed,
        });
        const isCompanyScopedList = Object.keys(listLoadParams).length > 0;

        if (!listStoreName || typeof listAction !== 'function') {
          return;
        }

        if (
          !isCompanyScopedList &&
          Array.isArray(listStore?.getters?.items) &&
          listStore.getters.items.length > 0
        ) {
          const columnKey = getColumnKey(column);
          setListOptionsByColumn(current => ({
            ...current,
            [columnKey]: normalizeCollectionItems(listStore.getters.items),
          }));
          return;
        }

        const columnKey = getColumnKey(column);
        const loadKey = `${columnKey}:${listStoreName}:${actionName}:${stableSerialize(listLoadParams)}`;
        if (loadedListStoresRef.current.has(loadKey)) {
          return;
        }

        loadedListStoresRef.current.add(loadKey);
        loadPromises.push(
          Promise.resolve(
            listAction({
              ...listLoadParams,
              itemsPerPage: LIST_OPTIONS_PAGE_SIZE,
              __storeMeta: {
                dedupeKey: `default-table-list-options:${loadKey}`,
                skipSystemError: true,
              },
            }),
          )
            .then(response => ({columnKey, items: normalizeCollectionItems(response)}))
            .catch(() => {
              loadedListStoresRef.current.delete(loadKey);
              return {columnKey, items: []};
            }),
        );
      });

      if (loadPromises.length === 0) {
        return Promise.resolve([]);
      }

      return Promise.all(loadPromises).then(results => {
        const nextOptionsByColumn = Object.fromEntries(
          results.map(result => [result.columnKey, result.items]),
        );

        if (Object.keys(nextOptionsByColumn).length > 0) {
          setListOptionsByColumn(current => ({
            ...current,
            ...nextOptionsByColumn,
          }));
        }

        return results;
      });
    },
    [currentCompany?.id, getOptionsForColumn, requestParamsSeed],
  );

  const buildRequestQuery = useCallback(
    (page, append = false) => {
      const query = {
        ...requestParamsSeed,
        itemsPerPage: pageSizeNumber,
        page,
      };

      if (autoSort?.field && autoSort?.direction) {
        query[`order[${autoSort.field}]`] = autoSort.direction;
      }

      Object.entries(autoFilters || {}).forEach(([fieldName, value]) => {
        if (!fieldName) return;

        if (fieldName === searchKey) {
          const normalizedSearch = normalizeText(value).replace(/^#/, '');
          if (normalizedSearch) {
            query.search = normalizedSearch;
            if (searchKey !== 'search') {
              query[searchKey] = normalizedSearch;
            }
          }
          return;
        }

        const column = columnsForTable.find(item => getColumnKey(item) === fieldName);

        if (column?.inputType === 'date-range' || column?.type === 'range-date') {
          const dateRange = resolveDateRangeQuery(value);
          if (dateRange.after) {
            query[`${fieldName}[after]`] = dateRange.after;
          }
          if (dateRange.before) {
            query[`${fieldName}[before]`] = dateRange.before;
          }
          return;
        }

        const normalizedValue = resolveFilterQueryValue(value);
        if (Array.isArray(normalizedValue)) {
          if (normalizedValue.length > 0) {
            query[fieldName] = normalizedValue;
          }
          return;
        }

        if (normalizedValue !== '') {
          query[fieldName] = normalizedValue;
        }
      });

      if (append) {
        query.append = true;
      }

      return query;
    },
    [autoFilters, autoSort?.direction, autoSort?.field, columnsForTable, pageSizeNumber, requestParamsSeed, searchKey],
  );
  const autoQuerySignature = useMemo(
    () =>
      stableSerialize({
        filters: autoFilters,
        pageSize: pageSizeNumber,
        requestParams: requestParamsSeed,
        searchKey,
        sort: autoSort,
      }),
    [autoFilters, autoSort, pageSizeNumber, requestParamsSeed, searchKey],
  );

  const loadAutoPage = useCallback(
    (page, { append = false } = {}) => {
      if (!autoMode || typeof resolvedActions.getItems !== 'function') {
        return Promise.resolve([]);
      }

      const requestId = autoRequestIdRef.current + 1;
      autoRequestIdRef.current = requestId;

      if (append) {
        setAutoLoadingMore(true);
      } else {
        setAutoLoading(true);
        setAutoHasLoaded(false);
        setAutoLastPageCount(0);
        autoPageRef.current = 0;
      }

      const query = buildRequestQuery(page, append);

      return Promise.resolve(resolvedActions.getItems(query))
        .then(response => {
          if (autoRequestIdRef.current !== requestId) {
            return response;
          }

          const pageItems = normalizeCollectionItems(response);
          autoPageRef.current = page;
          autoLoadedQueryKeyRef.current = autoQuerySignature;
          autoErroredQueryKeyRef.current = '';
          setAutoHasLoaded(true);
          setAutoLastPageCount(pageItems.length);
          return pageItems;
        })
        .catch(error => {
          if (autoRequestIdRef.current === requestId) {
            autoErroredQueryKeyRef.current = autoQuerySignature;
            showError?.(error?.message || 'Nao foi possivel carregar os registros.');
          }

          return [];
        })
        .finally(() => {
          if (autoRequestIdRef.current === requestId) {
            setAutoLoading(false);
            setAutoLoadingMore(false);
            endReachedLockRef.current = false;
          }
        });
    },
    [autoMode, autoQuerySignature, buildRequestQuery, resolvedActions, showError],
  );

  const availableColumns = useMemo(
    () => columnsForTable.filter(column => shouldIncludeColumn(column)),
    [columnsForTable],
  );

  useEffect(() => {
    setVisibleColumns(prev =>
      stableSerialize(prev) === stableSerialize(visibleColumnsSeed)
        ? prev
        : visibleColumnsSeed
    );
  }, [visibleColumnsSeed]);

  useEffect(() => {
    setViewMode(viewModeSeed);
  }, [viewModeSeed]);

  useEffect(() => {
    if (!autoMode) return;

    setAutoSort(prev =>
      stableSerialize(prev) === stableSerialize(storedSortSeed)
        ? prev
        : storedSortSeed,
    );
  }, [autoMode, storedSortSeed]);

  useEffect(() => {
    if (!autoMode) return;

    setAutoFilters(prev => {
      if (stableSerialize(prev) === stableSerialize(storeFilters)) {
        return prev;
      }

      return storeFilters;
    });
  }, [autoMode, storeFilters]);

  useEffect(() => {
    if (!autoMode || !isFocused) return;
    if (typeof resolvedActions.getItems !== 'function') return;
    if (
      autoLoading ||
      autoLoadingMore ||
      autoLoadedQueryKeyRef.current === autoQuerySignature ||
      autoErroredQueryKeyRef.current === autoQuerySignature
    ) {
      return;
    }

    endReachedLockRef.current = false;
    loadAutoPage(1, { append: false });
  }, [
    autoLoading,
    autoLoadingMore,
    autoMode,
    autoQuerySignature,
    isFocused,
    loadAutoPage,
    resolvedActions,
  ]);

  const tableColumns = useMemo(
    () => columnsForTable.filter(column => shouldIncludeColumn(column) && visibleColumns[getColumnKey(column)] !== false),
    [columnsForTable, visibleColumns],
  );

  const editableColumns = useMemo(
    () => tableColumns.filter(isEditableColumn),
    [tableColumns],
  );

  const activeFilterCount = useMemo(
    () => Object.values(resolvedFilters || {}).filter(value => normalizeText(value) !== '').length,
    [resolvedFilters],
  );
  const hasRowActions =
    showRowActions !== false &&
    (editableColumns.length > 0 || typeof onEditRow === 'function');
  const storeAddConfig = store?.getters?.add;
  const addConfig = add !== null && add !== undefined ? add : storeAddConfig;
  const hasAddInstruction = addConfig === true || (isObject(addConfig) && addConfig.enabled !== false);
  const shouldRenderAddButton =
    hasAddInstruction &&
    (typeof onAdd === 'function' || typeof resolvedActions.save === 'function');
  const resolvedIsLoading = autoMode ? (autoLoading || autoLoadingMore) : Boolean(isLoading);
  const resolvedData = autoMode
    ? (autoHasLoaded && Array.isArray(store?.getters?.items) ? store.getters.items : [])
    : (Array.isArray(data) ? data : []);
  const tableMinimumWidth = useMemo(
    () =>
      tableColumns.reduce(
        (totalWidth, column) => totalWidth + getColumnMinWidth(column),
        hasRowActions ? ACTIONS_CELL_WIDTH : 0,
      ),
    [hasRowActions, tableColumns],
  );
  const tableWidth = Math.max(tableContainerWidth, tableMinimumWidth);
  const tableLayoutStyle = useMemo(
    () => (tableWidth > 0 ? { minWidth: tableWidth, width: tableWidth } : null),
    [tableWidth],
  );
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const shouldForceCardsOnCompact = forceCardsOnCompact !== false;
  const effectiveViewMode =
    isCompactView && shouldForceCardsOnCompact
      ? (compactViewMode || 'cards')
      : viewMode;
  useEffect(() => {
    if (!shouldForceCardsOnCompact) {
      setCompactViewMode(null);
      return;
    }

    if (isCompactView) {
      setCompactViewMode('cards');
      return;
    }

    setCompactViewMode(null);
  }, [isCompactView, shouldForceCardsOnCompact]);
  const emptyStateLabel = resolvedIsLoading
    ? global.t?.t(storeName, 'label', 'loading') || 'Carregando...'
    : 'Nenhum registro encontrado';
  const storeTotalItems = store?.getters?.totalItems;
  const resolvedTotalItems = totalItems !== null && totalItems !== undefined
    ? totalItems
    : storeTotalItems;
  const totalItemsNumber = Number(resolvedTotalItems);
  const shouldRenderTotalItems =
    resolvedTotalItems !== null &&
    resolvedTotalItems !== undefined &&
    Number.isFinite(totalItemsNumber);
  const shouldRenderFooterTotalItems =
    shouldRenderTotalItems &&
    showTotalItemsInFooter !== false;
  const shouldRenderCompactToolbarTotalItems =
    showTotalItemsInCompactToolbar === true &&
    isCompactView &&
    shouldRenderTotalItems;
  const resolvedTotalItemsText =
    normalizeText(totalItemsText) !== ''
      ? totalItemsText
      : shouldRenderTotalItems
        ? `${totalItemsNumber} ${totalItemsLabel || global.t?.t(storeName, 'label', 'items') || 'registros'}`
        : '';
  const storeSummary = store?.getters?.summary;
  const resolvedSummary = summary !== null && summary !== undefined ? summary : storeSummary;
  const shouldReadSummary = resolvedSummary !== false && isObject(resolvedSummary);
  const summaryEntries = useMemo(() => {
    if (!shouldReadSummary) return [];

    const labels = summaryLabels || {};
    const usedPaths = new Set();
    const columnEntries = tableColumns.flatMap(column => {
      const operations = getSummaryOperations(column);
      if (!operations.length) return [];

      const columnLabel = formatStoreColumnLabel({
        columns: columnsForTable,
        fieldName: getColumnKey(column),
        fallbackLabel: column?.label || getColumnKey(column),
        storeName,
      });

      return operations.map(operation => {
        const fieldName = getSummaryField(column, operation);
        const path = [operation, fieldName];
        const pathKey = path.join('.');
        const value = resolvedSummary?.[operation]?.[fieldName];
        if (value === undefined) return null;

        usedPaths.add(pathKey);

        return {
          key: pathKey,
          label: labels[pathKey] || (operations.length > 1 ? `${columnLabel} ${operation}` : columnLabel),
          path,
          value,
          column,
        };
      }).filter(Boolean);
    });

    const genericEntries = flattenSummaryEntries({
      summaryLabels: labels,
      usedPaths,
      value: resolvedSummary,
    });

    return [...columnEntries, ...genericEntries].filter(entry =>
      entry?.value !== undefined &&
      entry?.value !== null &&
      normalizeText(entry.value) !== '',
    );
  }, [columnsForTable, resolvedSummary, shouldReadSummary, storeName, summaryLabels, tableColumns]);
  const shouldRenderFooterBar =
    (shouldRenderFooterTotalItems && !shouldRenderCompactToolbarTotalItems) ||
    summaryEntries.length > 0;
  const footerProps = {
    columns: columnsForTable,
    resolvedAccentColor,
    resolvedTotalItemsText,
    shouldRenderCompactToolbarTotalItems,
    shouldRenderFooterTotalItems,
    storeName,
    summaryEntries,
    summaryLabels,
    tableBorderColor,
    tableMutedColor,
    tableSurfaceColor,
    tableTextColor,
    toolbarCountBackgroundColor,
    toolbarCountTextColor,
  };

  const sortedData = useMemo(() => {
    const items = Array.isArray(resolvedData) ? [...resolvedData] : [];
    const sortField = resolvedSort?.field;
    const sortDirection = resolvedSort?.direction === 'desc' ? 'desc' : 'asc';
    const sortColumn = tableColumns.find(column => getSortField(column) === sortField);

    if (!sortField || !sortColumn) return items;

    return items.sort((left, right) => {
      const leftValue = resolveSortComparable({
        column: sortColumn,
        columns: tableColumns,
        row: left,
        storeName,
      });
      const rightValue = resolveSortComparable({
        column: sortColumn,
        columns: tableColumns,
        row: right,
        storeName,
      });

      const comparison =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : normalizeSortText(leftValue).localeCompare(normalizeSortText(rightValue));

      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }, [resolvedData, resolvedSort?.direction, resolvedSort?.field, storeName, tableColumns]);

  const resolvedHasMore = useMemo(
    () => {
      if (autoMode) {
        if (Number.isFinite(Number(resolvedTotalItems)) && Number(resolvedTotalItems) > 0) {
          return sortedData.length < Number(resolvedTotalItems);
        }

        return autoLastPageCount >= pageSizeNumber && sortedData.length > 0;
      }

      return resolveHasMore({
        hasMore,
        dataLength: sortedData.length,
        totalItems: resolvedTotalItems,
      });
    },
    [autoLastPageCount, autoMode, hasMore, pageSizeNumber, resolvedTotalItems, sortedData.length],
  );

  useEffect(() => {
    const nextPaginationState = {
      dataLength: sortedData.length,
      filtersKey: stableSerialize(resolvedFilters || {}),
      sortDirection: resolvedSort?.direction,
      sortField: resolvedSort?.field,
    };

    const previousPaginationState = previousPaginationStateRef.current;
    const didPaginationStateChange =
      previousPaginationState.dataLength !== nextPaginationState.dataLength ||
      previousPaginationState.filtersKey !== nextPaginationState.filtersKey ||
      previousPaginationState.sortDirection !== nextPaginationState.sortDirection ||
      previousPaginationState.sortField !== nextPaginationState.sortField;

    if (didPaginationStateChange) {
      endReachedLockRef.current = false;
      previousPaginationStateRef.current = nextPaginationState;
    }
  }, [resolvedFilters, resolvedSort?.direction, resolvedSort?.field, sortedData]);

  useEffect(() => {
    if (typeof onDataLoaded !== 'function') {
      return;
    }

    onDataLoaded(sortedData);
  }, [onDataLoaded, sortedData]);

  const beginEdit = useCallback((row, column) => {
    if (!isEditableColumn(column)) return;
    setEditingCell(`${row?.id || row?.['@id']}:${getColumnKey(column)}`);
  }, []);

  const clearEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const saveCell = useCallback((row, column, nextValue) => {
    const fieldName = getColumnKey(column);
    if (!fieldName || typeof resolvedActions.save !== 'function') {
      clearEdit();
      return Promise.resolve(null);
    }

    const currentValue = resolveEditValue(column, row);
    const normalizedNextValue = nextValue && typeof nextValue === 'object'
      ? normalizeOptionKey(nextValue)
      : normalizeText(nextValue);

    if (normalizeText(currentValue) === normalizeText(normalizedNextValue)) {
      clearEdit();
      return Promise.resolve(null);
    }

    const cellKey = `${row?.id || row?.['@id']}:${fieldName}`;
    const payload = {
      id: normalizeId(row?.['@id'] || row?.id),
      [fieldName]: formatSaveValue(column, nextValue, row),
    };

    setSavingCell(cellKey);

    return resolvedActions.save(payload)
      .then(savedItem => {
        onSaved?.(savedItem || { ...row, [fieldName]: nextValue }, row);
        return savedItem;
      })
      .catch(error => {
        console.error(error);
        return null;
      })
      .finally(() => {
        setSavingCell(null);
        clearEdit();
      });
  }, [clearEdit, onSaved, resolvedActions]);

  const requestSort = useCallback(column => {
    if (!isSortableColumn(column)) return;

    const fieldName = getSortField(column);
    const nextDirection =
      resolvedSort?.field === fieldName && resolvedSort?.direction === 'asc'
        ? 'desc'
        : 'asc';
    const nextSort = {
      direction: nextDirection,
      field: fieldName,
    };

    if (visibleColumnsPreferenceKey) {
      persistTableSortPreference(
        visibleColumnsPreferenceKey,
        nextSort,
      );
    }

    if (autoMode) {
      setAutoSort(nextSort);
      return;
    }

    onSortChange?.(nextSort);
  }, [
    autoMode,
    onSortChange,
    resolvedSort?.direction,
    resolvedSort?.field,
    visibleColumnsPreferenceKey,
  ]);

  const openEditModal = useCallback(row => {
    if (typeof onEditRow === 'function') {
      onEditRow(row);
      return;
    }

    setFormMode('edit');
    setEditingRow(row);
  }, [onEditRow]);

  const openAddForm = useCallback(() => {
    if (typeof onAdd === 'function') {
      onAdd();
      return;
    }

    if (typeof resolvedActions.save !== 'function') return;

    setFormMode('create');
    setEditingRow({});
  }, [onAdd, resolvedActions]);

  const closeEditModal = useCallback(() => {
    setEditingRow(null);
    setFormMode('edit');
  }, []);

  const commitFilters = useCallback(nextFilters => {
    const resolvedNextFilters = isObject(nextFilters) ? nextFilters : {};

    if (autoMode) {
      setAutoFilters(resolvedNextFilters);
      resolvedActions.setFilters?.(resolvedNextFilters);
      return;
    }

    onFilterChange?.(resolvedNextFilters);
  }, [autoMode, onFilterChange, resolvedActions]);

  const updateFilter = useCallback((fieldName, value) => {
    const nextFilters = { ...(resolvedFilters || {}) };
    const isEmpty =
      value === null ||
      value === undefined ||
      normalizeText(value) === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) delete nextFilters[fieldName];
    else nextFilters[fieldName] = value;

    commitFilters(nextFilters);
  }, [commitFilters, resolvedFilters]);

  const toggleColumn = useCallback(column => {
    const fieldName = getColumnKey(column);
    if (!fieldName) return;

    setVisibleColumns(prev => {
      const next = {
        ...sanitizeVisibleColumnsPreference({
          columns: columnsForTable,
          visibleColumns: prev,
        }),
        [fieldName]: prev[fieldName] === false,
      };

      resolvedActions?.setVisibleColumns?.(next);
      if (visibleColumnsStorageKey) {
        persistVisibleColumnsPreference(
          visibleColumnsStorageKey,
          next,
        );
      }
      return next;
    });
  }, [
    resolvedActions,
    columnsForTable,
    visibleColumnsStorageKey,
  ]);

  const toggleViewMode = useCallback(() => {
    const currentViewMode =
      isCompactView && shouldForceCardsOnCompact
        ? (compactViewMode || 'cards')
        : viewMode;
    const nextViewMode = currentViewMode === 'table' ? 'cards' : 'table';

    if (isCompactView && shouldForceCardsOnCompact) {
      setCompactViewMode(nextViewMode);
    }

    setViewMode(nextViewMode);

    if (!visibleColumnsPreferenceKey) {
      return;
    }

    persistTableViewModePreference(
      visibleColumnsPreferenceKey,
      nextViewMode,
    );
  }, [
    compactViewMode,
    isCompactView,
    shouldForceCardsOnCompact,
    viewMode,
    visibleColumnsPreferenceKey,
  ]);

  const handleEndReached = useCallback(() => {
    if (
      !resolvedHasMore ||
      resolvedIsLoading ||
      endReachedLockRef.current === true
    ) {
      return;
    }

    endReachedLockRef.current = true;

    if (autoMode) {
      const nextPage = autoPageRef.current + 1;
      loadAutoPage(nextPage, { append: true });
      return;
    }

    if (typeof onEndReached === 'function') {
      onEndReached();
    }
  }, [autoMode, loadAutoPage, onEndReached, resolvedHasMore, resolvedIsLoading]);

  const handleLayout = useCallback(event => {
    const nextWidth = Math.floor(event?.nativeEvent?.layout?.width || 0);
    if (nextWidth > 0) setTableContainerWidth(nextWidth);
  }, []);

  const renderEditableCell = (row, column) => {
    const fieldName = getColumnKey(column);
    const cellKey = `${row?.id || row?.['@id']}:${fieldName}`;
    const isEditing = editingCell === cellKey;
    const isSaving = savingCell === cellKey;
    const shouldDelegatePress =
      typeof onRowPress === 'function' &&
      !isEditableColumn(column);

    return (
      <View
        style={[getColumnStyle(column), isEditing ? styles.editingCell : null]}
        pointerEvents={shouldDelegatePress ? 'none' : 'auto'}
      >
        <DefaultInput
          accentColor={resolvedAccentColor}
          column={column}
          columns={columnsForTable}
          editing={isEditing}
          getOptionsForColumn={resolvedGetOptionsForColumn}
          onBeforeOpen={() => loadListOptionsForColumns([column])}
          onCancelEditing={clearEdit}
          onSave={value => saveCell(row, column, value)}
          onStartEditing={() => beginEdit(row, column)}
          row={row}
          saving={isSaving}
          storeName={storeName}
          variant="cell"
        />
      </View>
    );
  };

  const renderColumnFilter = column => {
    return (
      <DefaultColumnFilter
        accentColor={resolvedAccentColor}
        column={column}
        filters={resolvedFilters}
        onBeforeOpen={column?.list ? () => loadListOptionsForColumns([column]) : null}
        getOptionsForColumn={resolvedGetOptionsForColumn}
        onChange={updateFilter}
        storeName={storeName}
        style={getColumnStyle(column)}
      />
    );
  };

  const renderToolbarAction = action => {
    if (!action || action.hidden) return null;

    const isActive = action.active === true;
    const hasLabel = normalizeText(action.label) !== '';
    const actionColor = action.color || tableActionTextColor;

    return (
      <TouchableOpacity
        key={action.key || action.icon || action.label}
        accessibilityRole="button"
        accessibilityLabel={action.accessibilityLabel || action.label || action.key || action.icon}
        style={[
          styles.toolbarButton,
          { backgroundColor: tableActionBackgroundColor, borderColor: tableActionBorderColor },
          action.style,
        ]}
        activeOpacity={0.82}
        disabled={action.disabled === true}
        onPress={action.onPress}
      >
        {action.icon ? (
          <Icon
            name={action.icon}
            size={action.iconSize || 14}
            color={actionColor}
          />
        ) : null}
        {hasLabel ? (
          <Text style={[styles.toolbarActionLabel, { color: actionColor }, action.labelStyle]} numberOfLines={1}>
            {action.label}
          </Text>
        ) : null}
        {action.badge !== undefined && action.badge !== null ? (
          <Text style={[styles.toolbarBadgeText, { color: action.badgeColor || tableActionTextColor }]}>
            {action.badge}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderToolbarActions = () =>
    Array.isArray(toolbarActions) && toolbarActions.length > 0 ? (
      <View style={styles.toolbarActionGroup}>{toolbarActions.map(renderToolbarAction)}</View>
    ) : null;

  const getColumnByField = useCallback(
    fieldName => columnsForTable.find(column => getColumnKey(column) === fieldName),
    [columnsForTable],
  );

  const buildRowHelpers = useCallback(
    row => {
      const openEdit = () => openEditModal(row);
      const openRow = typeof onRowPress === 'function' ? () => onRowPress(row) : null;
      const renderValue = (fieldName, fallback = '-') => {
        const column = getColumnByField(fieldName);
        if (!column) return fallback;
        return resolveCellText({ column, columns: columnsForTable, row, storeName });
      };
      const renderField = (fieldName, options = {}) => {
        const column = getColumnByField(fieldName);
        if (!column) return null;

        const cellKey = `${row?.id || row?.['@id']}:${fieldName}`;
        const isEditing = editingCell === cellKey;
        const isSaving = savingCell === cellKey;

        return (
          <DefaultInput
            accentColor={options.accentColor || resolvedAccentColor}
            column={column}
            columns={columnsForTable}
            containerStyle={options.containerStyle}
            displayValue={options.displayValue}
            editing={isEditing}
            getOptionsForColumn={resolvedGetOptionsForColumn}
            inputStyle={options.inputStyle}
            label={options.label}
            numberOfLines={options.numberOfLines}
            onBeforeOpen={() => loadListOptionsForColumns([column])}
            onCancelEditing={clearEdit}
            onSave={value => saveCell(row, column, value)}
            onStartEditing={() => beginEdit(row, column)}
            readTextStyle={options.readTextStyle || options.textStyle}
            row={row}
            saving={isSaving}
            showLabel={options.showLabel}
            storeName={storeName}
            variant={options.variant || 'card'}
          />
        );
      };

      return {
        openEdit,
        openRow,
        renderField,
        renderValue,
      };
    },
    [
      resolvedAccentColor,
      beginEdit,
      clearEdit,
      columnsForTable,
      editingCell,
      getColumnByField,
      resolvedGetOptionsForColumn,
      openEditModal,
      onRowPress,
      saveCell,
      savingCell,
      storeName,
    ],
  );

  const resolveRowStyle = useCallback(
    (row, index) => {
      if (typeof rowStyle === 'function') {
        return rowStyle(row, index);
      }

      return rowStyle;
    },
    [rowStyle],
  );

  const renderCardItem = (row, index = 0) => {
    const helpers = buildRowHelpers(row);
    const rowStyleValue = resolveRowStyle(row, index);

    if (typeof renderCard === 'function') {
      return (
        <View key={row?.['@id'] || row?.id} style={[styles.cardItem, rowStyleValue]}>
          {renderCard({
            item: row,
            openEdit: helpers.openEdit,
            openRow: helpers.openRow,
            renderField: helpers.renderField,
            renderValue: helpers.renderValue,
            row,
          })}
          {hasRowActions ? (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
                activeOpacity={0.82}
                onPress={helpers.openEdit}>
                <Icon name="edit-2" size={14} color={tableMutedColor} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    }

    return (
      <View
        key={row?.['@id'] || row?.id}
        style={[
          styles.defaultCard,
          { backgroundColor: tableSurfaceColor, borderColor: tableBorderColor },
          rowStyleValue,
        ]}
      >
        {tableColumns.map(column => (
          <View key={getColumnKey(column)} style={styles.defaultCardLine}>
            <Text style={[styles.defaultCardLabel, { color: tableMutedColor }]}>
              {formatStoreColumnLabel({
                columns: columnsForTable,
                fieldName: getColumnKey(column),
                fallbackLabel: column?.label || getColumnKey(column),
                storeName,
              })}
            </Text>
            {helpers.renderField(getColumnKey(column), {
              readTextStyle: [styles.defaultCardValue, { color: tableTextColor }],
              numberOfLines: 1,
            })}
          </View>
        ))}
        {hasRowActions ? (
          <TouchableOpacity
            style={[styles.cardEditButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
            activeOpacity={0.82}
            onPress={helpers.openEdit}>
            <Icon name="edit-2" size={14} color={tableMutedColor} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = isTable => {
    return (
      <View style={[styles.emptyBox, isTable ? tableLayoutStyle : null]}>
        {resolvedIsLoading ? (
          <StateStore compact loading={emptyStateLabel} />
        ) : (
          <Text style={[styles.emptyText, { color: tableMutedColor }]}>{emptyStateLabel}</Text>
        )}
      </View>
    );
  };

  const renderLoadingOverlay = () => {
    if (!resolvedIsLoading || sortedData.length === 0) {
      return null;
    }

    return (
      <View pointerEvents="none" style={styles.loadingOverlay}>
        <View
          style={[
            styles.loadingOverlayCard,
            { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor },
          ]}
        >
          <StateStore compact loading="Carregando mais registros..." />
        </View>
      </View>
    );
  };

  const renderTableItem = ({ item: row, index }) => {
    const hasRowPress = typeof onRowPress === 'function';
    const RowComponent = hasRowPress ? TouchableOpacity : View;
    const rowStyleValue = resolveRowStyle(row, index);
    const rowPressProps = hasRowPress
      ? {
        activeOpacity: 0.84,
        onPress: () => onRowPress(row),
      }
      : {};
    const rowBackgroundColor = index % 2 === 0 ? tableOddColor : tableEvenColor;

    return (
      <RowComponent
        key={getRowKey(row)}
        style={[
          styles.row,
          tableLayoutStyle,
          { backgroundColor: rowBackgroundColor, borderBottomColor: tableBorderColor },
          rowStyleValue,
        ]}
        {...rowPressProps}
      >
        {tableColumns.map(column => (
          <React.Fragment key={getColumnKey(column)}>
            {renderEditableCell(row, column)}
          </React.Fragment>
        ))}
        {hasRowActions ? (
          <View style={[styles.cell, styles.actionsCell]}>
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
              activeOpacity={0.82}
              onPress={() => openEditModal(row)}>
              <Icon name="edit-2" size={14} color={tableMutedColor} />
            </TouchableOpacity>
          </View>
        ) : null}
      </RowComponent>
    );
  };

  const renderEditModal = () => {
    const isCreate = formMode === 'create';

    return (
      <Modal visible={Boolean(editingRow)} transparent animationType="fade" onRequestClose={closeEditModal}>
        <View style={[styles.modalOverlay, { backgroundColor: modalOverlayColor }]}>
          <View style={[styles.modalCard, { borderColor: modalBorderColor, backgroundColor: modalBackgroundColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: modalBorderColor }]}>
              <Text style={[styles.modalTitle, { color: modalHeaderTextColor }]}>
                {isCreate
                  ? global.t?.t(storeName, 'button', 'add') || 'Adicionar'
                  : global.t?.t(storeName, 'button', 'edit') || 'Editar'}
              </Text>
              <TouchableOpacity
                style={[styles.modalCloseButton, { borderColor: modalBorderColor, backgroundColor: modalBackgroundColor }]}
                onPress={closeEditModal}>
                <Icon name="x" size={18} color={modalCloseIconColor} />
              </TouchableOpacity>
            </View>

            <DefaultForm
              accentColor={resolvedAccentColor}
              actions={resolvedActions}
              columns={isCreate ? columnsForTable : editableColumns}
              getOptionsForColumn={resolvedGetOptionsForColumn}
              mode={formMode}
              onBeforeOpen={column => loadListOptionsForColumns([column])}
              onCancel={closeEditModal}
              onSaved={(savedItem, originalRow) => {
                onSaved?.(savedItem, originalRow);
                closeEditModal();
              }}
              row={editingRow || {}}
              storeName={storeName}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderColumnMenuModal = () => {
    if (!isColumnMenuOpen) return null;

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setIsColumnMenuOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: modalOverlayColor }]}>
          <View style={[styles.modalCard, styles.columnMenuModalCard, { borderColor: modalBorderColor, backgroundColor: modalBackgroundColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: modalBorderColor }]}>
              <Text style={[styles.modalTitle, { color: modalHeaderTextColor }]} numberOfLines={1}>
                Colunas
              </Text>
              <TouchableOpacity
                style={[styles.modalCloseButton, { borderColor: modalBorderColor, backgroundColor: modalBackgroundColor }]}
                activeOpacity={0.82}
                onPress={() => setIsColumnMenuOpen(false)}
              >
                <Icon name="x" size={16} color={modalCloseIconColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.columnMenuModalBody} contentContainerStyle={styles.columnMenuModalList}>
              {availableColumns.map(column => {
                const fieldName = getColumnKey(column);
                const label = formatStoreColumnLabel({
                  columns: columnsForTable,
                  fieldName,
                  fallbackLabel: column?.label || fieldName,
                  storeName,
                });
                const checked = visibleColumns[fieldName] !== false;

                return (
                  <TouchableOpacity key={fieldName} style={styles.columnMenuItem} activeOpacity={0.82} onPress={() => toggleColumn(column)}>
                    <Icon name={checked ? 'check-square' : 'square'} size={16} color={checked ? checkboxSelectedMarkColor : checkboxBorderColor} />
                    <Text style={[styles.columnMenuText, { color: modalTextColor }]} numberOfLines={1}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.wrap, { borderColor: panelBorderColor, backgroundColor: panelBackgroundColor }]} onLayout={handleLayout}>
      <View style={[styles.toolbar, { borderBottomColor: toolbarBorderColor, backgroundColor: toolbarBackgroundColor }]}>
        {shouldRenderCompactToolbarTotalItems ? (
          <View style={styles.toolbarCompactLead}>
            <View style={[styles.toolbarCountPill, { backgroundColor: toolbarCountBackgroundColor }]}>
              <Text
                style={[styles.toolbarCountText, { color: toolbarCountTextColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {resolvedTotalItemsText}
              </Text>
            </View>
            {searchProps ? (
              <DefaultSearch
                accentColor={resolvedAccentColor}
                compact
                storeName={storeName}
                {...searchProps}
                filters={autoMode ? resolvedFilters : searchProps?.filters}
                onChangeFilters={autoMode ? commitFilters : searchProps?.onChangeFilters}
                value={autoMode ? resolvedSearchValue : searchProps?.value}
                style={[styles.toolbarSearch, styles.toolbarCompactSearch, searchProps?.style]}
              />
            ) : null}
            {renderToolbarActions()}
          </View>
        ) : null}

        <View style={shouldRenderCompactToolbarTotalItems ? styles.toolbarCompactActions : styles.toolbarLeft}>
          {!shouldRenderCompactToolbarTotalItems && searchProps ? (
            <DefaultSearch
              accentColor={resolvedAccentColor}
              compact
              storeName={storeName}
              {...searchProps}
              filters={autoMode ? resolvedFilters : searchProps?.filters}
              onChangeFilters={autoMode ? commitFilters : searchProps?.onChangeFilters}
              value={autoMode ? resolvedSearchValue : searchProps?.value}
              style={[styles.toolbarSearch, searchProps?.style]}
            />
          ) : null}
          {!shouldRenderCompactToolbarTotalItems ? renderToolbarActions() : null}
          {showColumnFiltersButton ? (
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                { borderColor: tableButtonBorderColor, backgroundColor: tableButtonBackgroundColor },
                showColumnFilters
                  ? { backgroundColor: tableButtonPressedBackgroundColor, borderColor: tableButtonPressedBorderColor }
                  : null,
              ]}
              activeOpacity={0.82}
              onPress={() => setShowColumnFilters(prev => !prev)}
            >
              <Icon
                name="filter"
                size={14}
                color={showColumnFilters ? tableButtonPressedIconColor : tableButtonIconColor}
              />
              {activeFilterCount > 0 ? (
                <Text
                  style={[
                    styles.toolbarBadgeText,
                    { color: showColumnFilters ? tableButtonPressedIconColor : tableButtonIconColor },
                  ]}>
                  {activeFilterCount}
                </Text>
              ) : null}
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[
              styles.toolbarButton,
              { borderColor: tableButtonBorderColor, backgroundColor: tableButtonBackgroundColor },
              effectiveViewMode !== 'table'
                ? { backgroundColor: tableButtonPressedBackgroundColor, borderColor: tableButtonPressedBorderColor }
                : null,
            ]}
            activeOpacity={0.82}
            onPress={toggleViewMode}
          >
            <Icon
              name={effectiveViewMode === 'table' ? 'list' : 'grid'}
              size={14}
              color={effectiveViewMode !== 'table' ? tableButtonPressedIconColor : tableButtonIconColor}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolbarButton, { borderColor: tableButtonBorderColor, backgroundColor: tableButtonBackgroundColor }]}
            activeOpacity={0.82}
            onPress={() => setIsColumnMenuOpen(prev => !prev)}>
            <Icon name="columns" size={14} color={tableButtonTextColor} />
          </TouchableOpacity>
          {shouldRenderAddButton ? (
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                styles.toolbarAddButton,
                { backgroundColor: tableButtonBackgroundColor, borderColor: tableButtonBackgroundColor },
              ]}
              activeOpacity={0.85}
              onPress={openAddForm}
            >
              <Icon name="plus" size={16} color={tableButtonTextColor} />
            </TouchableOpacity>
          ) : null}
        </View>

      </View>

      {effectiveViewMode === 'cards' ? (
        <FlatList
          data={sortedData}
          keyExtractor={getRowKey}
          renderItem={({ item, index }) => renderCardItem(item, index)}
          style={styles.cardsScroll}
          contentContainerStyle={styles.cardsGrid}
          ListEmptyComponent={renderEmptyState(false)}
          ListFooterComponent={null}
          nestedScrollEnabled
          onMomentumScrollBegin={onMomentumScrollBegin || undefined}
          onScrollBeginDrag={onScrollBeginDrag || undefined}
          onEndReached={handleEndReached}
          onEndReachedThreshold={END_REACHED_THRESHOLD}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView horizontal style={styles.scroll}>
          <View style={[styles.content, tableLayoutStyle]}>
            <View style={[styles.headerRow, tableLayoutStyle, { backgroundColor: tableHeaderColor, borderBottomColor: tableBorderColor }]}>
              {tableColumns.map(column => {
                const fieldName = getColumnKey(column);
                const label = formatStoreColumnLabel({
                  columns: columnsForTable,
                  fieldName,
                  fallbackLabel: column?.label || fieldName,
                  storeName,
                });

                const sortFieldName = getSortField(column);

                return (
                  <TouchableOpacity
                    key={fieldName}
                    style={getColumnStyle(column)}
                    activeOpacity={isSortableColumn(column) ? 0.8 : 1}
                    onPress={() => requestSort(column)}
                  >
                    <View style={styles.sortableHeader}>
                      <Text style={[styles.headerText, { color: tableTextColor }]} numberOfLines={1}>{label}</Text>
                      {isSortableColumn(column) && resolvedSort?.field === sortFieldName ? (
                        <Icon name={resolvedSort?.direction === 'desc' ? 'chevron-down' : 'chevron-up'} size={12} color={tableTextColor} />
                      ) : isSortableColumn(column) ? (
                        <Icon name="chevrons-up" size={12} color={tableBorderColor} />
                      ) : null}
                      {resolvedFilters?.[fieldName] ? <Icon name="filter" size={11} color={tableTextColor} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {hasRowActions ? (
                <View style={[styles.cell, styles.actionsCell]}>
                  <Text style={[styles.headerText, { color: tableTextColor }]}>Acoes</Text>
                </View>
              ) : null}
            </View>

            {showColumnFiltersButton && showColumnFilters ? (
              <View style={[styles.filterRow, tableLayoutStyle, { backgroundColor: tableSurfaceColor, borderBottomColor: tableBorderColor }]}>
                {tableColumns.map(column => (
                  <React.Fragment key={getColumnKey(column)}>
                    {renderColumnFilter(column)}
                  </React.Fragment>
                ))}
                {hasRowActions ? <View style={[styles.cell, styles.actionsCell]} /> : null}
              </View>
            ) : null}

            <FlatList
              data={sortedData}
              keyExtractor={getRowKey}
              renderItem={renderTableItem}
              style={styles.tableList}
              contentContainerStyle={styles.tableListContent}
              ListEmptyComponent={renderEmptyState(true)}
              ListFooterComponent={null}
              nestedScrollEnabled
              onMomentumScrollBegin={onMomentumScrollBegin || undefined}
              onScrollBeginDrag={onScrollBeginDrag || undefined}
              onEndReached={handleEndReached}
              onEndReachedThreshold={END_REACHED_THRESHOLD}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      )}

      {renderLoadingOverlay()}

      {footerComponent ? (
        React.isValidElement(footerComponent) ? (
          footerComponent
        ) : (
          React.createElement(footerComponent, footerProps)
        )
      ) : shouldRenderFooterBar ? (
        <View style={[styles.footerBar, { backgroundColor: tableSurfaceColor, borderTopColor: tableBorderColor }]}>
          {summaryEntries.length > 0 ? (
            <View style={styles.footerSummaryList}>
              {summaryEntries.map(entry => (
                <View key={entry.key} style={styles.footerSummaryItem}>
                  <Text style={[styles.footerSummaryLabel, { color: tableMutedColor }]} numberOfLines={1}>
                    {entry.label}
                  </Text>
                  <Text
                    style={[
                      styles.footerSummaryValue,
                      entry.path?.[0] === 'sum' || isMoneySummaryPath(entry.path)
                        ? { color: resolvedAccentColor }
                        : { color: tableTextColor },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {formatSummaryValue({
                      column: entry.column,
                      columns: columnsForTable,
                      path: entry.path,
                      storeName,
                      value: entry.value,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {shouldRenderFooterTotalItems && !shouldRenderCompactToolbarTotalItems ? (
            <View style={[styles.footerCountPill, { backgroundColor: toolbarCountBackgroundColor }]}>
              <Text
                style={[styles.footerCountText, { color: toolbarCountTextColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {resolvedTotalItemsText}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {renderColumnMenuModal()}
      {renderEditModal()}
    </View>
  );
};

export default DefaultTable;

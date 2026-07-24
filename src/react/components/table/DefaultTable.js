/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { getAllStores, useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import DefaultColumnMenu from './DefaultColumnMenu';
import DefaultEditModal from './DefaultEditModal';
import DefaultFiltersModal from './DefaultFiltersModal';
import DefaultSearchModal from './DefaultSearchModal';
import DefaultTableFooter from './DefaultTableFooter';
import DefaultTableEmptyState from './DefaultTableEmptyState';
import DefaultTableLoadingOverlay from './DefaultTableLoadingOverlay';
import DefaultTableToolbar from './DefaultTableToolbar';
import { setDefaultTableRuntime } from './DefaultTable.runtime';
import DefaultInput from '../inputs/DefaultInput';
import useDefaultTableTheme from './useDefaultTableTheme';
import {
  formatSaveValue,
  getColumnKey,
  isEditableColumn,
  isDateLikeColumn,
  normalizeId,
  normalizeOptionKey,
  normalizeText,
  resolveStoreNameFromList,
  resolveCellText,
  resolveEditValue,
} from '../inputs/defaultInputUtils';
import {
  ACTIONS_CELL_WIDTH,
  COLLAPSED_SEARCH_MAX_CONTAINER_WIDTH,
  COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH,
  DEFAULT_COMPACT_BREAKPOINT,
  END_REACHED_THRESHOLD,
  flattenSummaryEntries,
  getColumnMinWidth,
  getColumnStyle,
  getSortField,
  getSummaryField,
  getSummaryOperations,
  getRowKey,
  isObject,
  isSortableColumn,
  normalizeSortText,
  normalizeCollectionItems,
  resolveListActionName,
  resolveColumnListLoadParams,
  resolveDateRangeQuery,
  resolveDefaultSort,
  resolveFilterQueryValue,
  resolveHasMore,
  resolveSortComparable,
  sanitizeStoredSortPreference,
  shouldIncludeColumn,
  stableSerialize,
} from './DefaultTable.utils';
import {
  persistTableFiltersPreference,
  persistTableSortPreference,
  persistTableViewModePreference,
  persistVisibleColumnsPreference,
  resolveDefaultTablePreferenceScope,
  resolveStoredTableFiltersPreference,
  resolveStoredTableSortPreference,
  resolveStoredTableViewModePreference,
  resolveStoredVisibleColumnsPreference,
  sanitizeTableFiltersPreference,
  sanitizeVisibleColumnsPreference,
} from '../../utils/tableVisibleColumnsPreferences';
import styles from './DefaultTable.styles';

export { resolveColumnListLoadParams } from './DefaultTable.utils';

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
  rowActionsComponent = null,
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
  const route = useRoute?.();
  const store = useStore(storeName);
  const peopleStore = useStore('people');
  const tablePreferenceScope = useMemo(
    () =>
      resolveDefaultTablePreferenceScope({
        preferenceKey: visibleColumnsPreferenceKey,
        route,
        storeName,
      }),
    [route?.key, route?.name, storeName, visibleColumnsPreferenceKey],
  );
  const tablePreferenceSignature = useMemo(
    () => stableSerialize(tablePreferenceScope),
    [tablePreferenceScope],
  );
  const visibleColumnsStorageKey = tablePreferenceScope;
  const [editingCell, setEditingCell] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formMode, setFormMode] = useState('edit');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [listOptionsByColumn, setListOptionsByColumn] = useState({});
  const [savingCell, setSavingCell] = useState(null);
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
  const visibleColumnsSeedSignature = useMemo(
    () => stableSerialize(visibleColumnsSeed),
    [visibleColumnsSeed],
  );
  const viewModeSeed = useMemo(
    () =>
      resolveStoredTableViewModePreference(
        tablePreferenceScope,
        initialViewMode,
      ),
    [initialViewMode, tablePreferenceScope],
  );
  const [visibleColumns, setVisibleColumns] = useState(() => visibleColumnsSeed);
  const [viewMode, setViewMode] = useState(() => viewModeSeed);
  const [compactViewMode, setCompactViewMode] = useState(null);
  const {
    palette,
    resolvedAccentColor,
    themeColors,
    themeTokens,
  } = useDefaultTableTheme(accentColor);
  const tableHeaderColor = themeTokens['bg-headers-light'] || resolvedAccentColor;
  const tableEvenColor = themeTokens.listItemEvenRow || themeTokens['bg-even-light'] || palette.background;
  const tableOddColor = themeTokens.listItemOddRow || themeTokens['bg-odd-light'] || palette.background;
  const tableBorderColor = palette.border;
  const tableSurfaceColor = palette.background;
  const tableTextColor = palette.text;
  const tableMutedColor = palette.textSecondary;
  const panelBackgroundColor = themeColors.panelBackground;
  const panelBorderColor = themeColors.panelBorder;
  const toolbarCountBackgroundColor = themeColors.badgeBackground;
  const toolbarCountTextColor = themeColors.badgeText;
  const tableFilterBackgroundColor = themeColors.tableFilterBackground;
  const tableFilterBorderColor = themeColors.tableFilterBorder;
  const tableFilterTextColor = themeColors.tableFilterText;
  const isFocused = useIsFocused();
  const {showError} = useMessage() || {};
  const autoMode = data === undefined && normalizeText(storeName) !== '';
  const searchKey = searchProps?.searchKey || 'search';
  const storeActions = store?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const currentCompanyId = peopleGetters.currentCompany?.id;
  const resolvedActions = useMemo(
    () => ({
      ...storeActions,
      ...(actions || {}),
    }),
    [actions, storeActions],
  );
  const setStoreFilters = resolvedActions.setFilters;
  const storeColumns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const columnsForTable = storeColumns.length > 0 ? storeColumns : columns;
  const storeFilters = isObject(store?.getters?.filters) ? store.getters.filters : {};
  const storeFiltersSignature = useMemo(
    () => stableSerialize(storeFilters),
    [storeFilters],
  );
  const requestParamsSeed = isObject(requestParams) ? requestParams : {};
  const isFiltersControlled = typeof onFilterChange === 'function';
  const storedFiltersPreference = useMemo(
    () => resolveStoredTableFiltersPreference(tablePreferenceScope),
    [tablePreferenceScope],
  );
  const hasStoredFiltersPreference = isObject(storedFiltersPreference);
  const storedFiltersSeed = useMemo(
    () =>
      sanitizeTableFiltersPreference({
        columns: columnsForTable,
        filters: storedFiltersPreference,
        searchKey,
      }),
    [columnsForTable, searchKey, storedFiltersPreference],
  );
  const storedFiltersSeedSignature = useMemo(
    () => stableSerialize(storedFiltersSeed),
    [storedFiltersSeed],
  );
  const initialFiltersSeed = autoMode
    ? (
      Object.keys(filters || {}).length > 0
        ? filters
        : hasStoredFiltersPreference
          ? storedFiltersSeed
          : storeFilters
    )
    : (isObject(filters) ? filters : {});
  const [autoFilters, setAutoFilters] = useState(() => initialFiltersSeed);
  const controlledFiltersSignature = useMemo(
    () => stableSerialize(isObject(filters) ? filters : {}),
    [filters],
  );
  const defaultSortSeed = useMemo(
    () => resolveDefaultSort(columnsForTable),
    [columnsForTable],
  );
  const storedSortSeed = useMemo(
    () =>
      sanitizeStoredSortPreference({
        columns: columnsForTable,
        fallbackSort: sort || defaultSortSeed || null,
        sort: resolveStoredTableSortPreference(tablePreferenceScope),
      }),
    [columnsForTable, defaultSortSeed, sort, tablePreferenceScope],
  );
  const storedSortSeedSignature = useMemo(
    () => stableSerialize(storedSortSeed),
    [storedSortSeed],
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
  const hasAppliedStoredFiltersRef = useRef(false);
  const pageSizeNumber = Number(requestParamsSeed.itemsPerPage || pageSize || 50) || 50;
  const hasCustomRowActions = typeof rowActionsComponent === 'function';
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
  }, [currentCompanyId]);

  const loadListOptionsForColumns = useCallback(
    (targetColumns = [], searchValue = '') => {
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
        if (!normalizeText(searchValue) && Array.isArray(explicitOptions)) {
          return;
        }

        const listStoreName = resolveStoreNameFromList(column.list);
        const actionName = resolveListActionName(column.list);
        const listStore = stores?.[listStoreName];
        const listAction = listStore?.actions?.[actionName];

        const listLoadParams = resolveColumnListLoadParams({
          column,
          currentCompanyId,
          requestParams: requestParamsSeed,
          searchValue,
        });
        const isCompanyScopedList = Object.keys(listLoadParams).length > 0;

        if (!listStoreName || typeof listAction !== 'function') {
          return;
        }

        if (
          !isCompanyScopedList &&
          !normalizeText(searchValue) &&
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
    [currentCompanyId, getOptionsForColumn, requestParamsSeed],
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

        if (isDateLikeColumn(column)) {
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
      stableSerialize(prev) === visibleColumnsSeedSignature
        ? prev
        : visibleColumnsSeed
    );
  }, [visibleColumnsSeedSignature]);

  useEffect(() => {
    setViewMode(viewModeSeed);
  }, [viewModeSeed]);

  useEffect(() => {
    if (!autoMode) return;

    setAutoSort(prev =>
      stableSerialize(prev) === storedSortSeedSignature
        ? prev
        : storedSortSeed,
    );
  }, [autoMode, storedSortSeedSignature]);

  useEffect(() => {
    if (!autoMode || isFiltersControlled) return;

    if (hasStoredFiltersPreference && !hasAppliedStoredFiltersRef.current) {
      hasAppliedStoredFiltersRef.current = true;
      setAutoFilters(prev =>
        stableSerialize(prev) === storedFiltersSeedSignature
          ? prev
          : storedFiltersSeed,
      );

      if (storeFiltersSignature !== storedFiltersSeedSignature) {
        setStoreFilters?.(storedFiltersSeed);
      }
      return;
    }

    setAutoFilters(prev => {
      if (stableSerialize(prev) === storeFiltersSignature) {
        return prev;
      }

      return storeFilters;
    });
  }, [
    autoMode,
    hasStoredFiltersPreference,
    isFiltersControlled,
    setStoreFilters,
    storeFilters,
    storeFiltersSignature,
    storedFiltersSeed,
    storedFiltersSeedSignature,
  ]);

  useEffect(() => {
    hasAppliedStoredFiltersRef.current = false;
  }, [tablePreferenceSignature]);

  useEffect(() => {
    if (!autoMode || !isFiltersControlled) return;

    const nextFilters = isObject(filters) ? filters : {};
    const shouldApplyStoredFilters =
      hasStoredFiltersPreference &&
      !hasAppliedStoredFiltersRef.current &&
      Object.keys(nextFilters).length === 0;

    if (shouldApplyStoredFilters) {
      hasAppliedStoredFiltersRef.current = true;
      setAutoFilters(prev =>
        stableSerialize(prev) === storedFiltersSeedSignature
          ? prev
          : storedFiltersSeed,
      );
      setStoreFilters?.(storedFiltersSeed);
      onFilterChange?.(storedFiltersSeed);
      return;
    }

    hasAppliedStoredFiltersRef.current = true;
    setAutoFilters(prev =>
      stableSerialize(prev) === controlledFiltersSignature
        ? prev
        : nextFilters,
    );
    if (storeFiltersSignature !== controlledFiltersSignature) {
      setStoreFilters?.(nextFilters);
    }

    persistTableFiltersPreference(
      tablePreferenceScope,
      sanitizeTableFiltersPreference({
        columns: columnsForTable,
        filters: nextFilters,
        searchKey,
      }),
    );
  }, [
    autoMode,
    columnsForTable,
    controlledFiltersSignature,
    hasStoredFiltersPreference,
    isFiltersControlled,
    onFilterChange,
    searchKey,
    setStoreFilters,
    storeFiltersSignature,
    storedFiltersSeed,
    storedFiltersSeedSignature,
    tablePreferenceScope,
  ]);

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
  const filterColumns = useMemo(
    () => columnsForTable.filter(
      column =>
        shouldIncludeColumn(column) &&
        column?.filter !== false &&
        column?.filters !== false,
    ),
    [columnsForTable],
  );
  const hasTableFilters = showColumnFiltersButton && filterColumns.length > 0;

  const editableColumns = useMemo(
    () => tableColumns.filter(isEditableColumn),
    [tableColumns],
  );

  const activeFilterCount = useMemo(
    () => Object.values(resolvedFilters || {}).filter(value => normalizeText(value) !== '').length,
    [resolvedFilters],
  );
  const hasEditAction =
    editableColumns.length > 0 || typeof onEditRow === 'function';
  const hasRowActions =
    showRowActions !== false &&
    (hasEditAction || hasCustomRowActions);
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
        hasRowActions ? (hasCustomRowActions ? 96 : ACTIONS_CELL_WIDTH) : 0,
      ),
    [hasCustomRowActions, hasRowActions, tableColumns],
  );
  const actionsCellWidth = hasRowActions
    ? (hasCustomRowActions ? 96 : ACTIONS_CELL_WIDTH)
    : 0;
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
    ? global.t?.t(storeName, 'label', 'loading')
    : global.t?.t(storeName, 'label', 'empty');
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
    shouldRenderTotalItems &&
    !shouldRenderFooterTotalItems;
  const shouldCollapseToolbarSearch =
    Boolean(searchProps) &&
    ((width > 0 && width <= COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH) ||
      (tableContainerWidth > 0 &&
        tableContainerWidth <= COLLAPSED_SEARCH_MAX_CONTAINER_WIDTH));
  const searchAccessibilityLabel =
    searchProps?.accessibilityLabel ||
    searchProps?.placeholder ||
    global.t?.t(storeName, 'label', 'search') ||
    global.t?.t(storeName, 'input', searchKey) ||
    global.t?.t(storeName, 'placeholder', searchKey);
  const debugFallbackParameters = useMemo(() => {
    if (autoMode) {
      return buildRequestQuery(autoPageRef.current || 1, false);
    }

    return {
      filters: resolvedFilters || {},
      requestParams: requestParamsSeed,
      sort: resolvedSort || null,
    };
  }, [autoMode, buildRequestQuery, requestParamsSeed, resolvedFilters, resolvedSort]);
  const resolvedTotalItemsText =
    normalizeText(totalItemsText) !== ''
      ? totalItemsText
      : shouldRenderTotalItems
        ? `${totalItemsNumber} ${totalItemsLabel || global.t?.t(storeName, 'label', 'items')}`
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

  const requestRowPress = useCallback(row => {
    if (editingCell || savingCell || typeof onRowPress !== 'function') {
      return;
    }

    onRowPress(row);
  }, [editingCell, onRowPress, savingCell]);

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

    persistTableSortPreference(tablePreferenceScope, nextSort);

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
    tablePreferenceScope,
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
    const persistedFilters = sanitizeTableFiltersPreference({
      columns: columnsForTable,
      filters: resolvedNextFilters,
      searchKey,
    });

    persistTableFiltersPreference(tablePreferenceScope, persistedFilters);

    if (autoMode) {
      setAutoFilters(resolvedNextFilters);
      setStoreFilters?.(resolvedNextFilters);
      onFilterChange?.(resolvedNextFilters);
      return;
    }

    onFilterChange?.(resolvedNextFilters);
  }, [
    autoMode,
    columnsForTable,
    onFilterChange,
    searchKey,
    setStoreFilters,
    tablePreferenceScope,
  ]);

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

    persistTableViewModePreference(
      tablePreferenceScope,
      nextViewMode,
    );
  }, [
    compactViewMode,
    isCompactView,
    shouldForceCardsOnCompact,
    tablePreferenceScope,
    viewMode,
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
          onSearchChange={value => loadListOptionsForColumns([column], value)}
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

  setDefaultTableRuntime(storeName, {
    activeFilterCount,
    debugFallbackParameters,
    effectiveViewMode,
    editModal: {
      actions: resolvedActions,
      columns: formMode === 'create' ? columnsForTable : editableColumns,
      editingRow,
      formMode,
      getOptionsForColumn: resolvedGetOptionsForColumn,
      onBeforeOpen: column => loadListOptionsForColumns([column]),
      onClose: closeEditModal,
      onSearchChange: (column, value) => loadListOptionsForColumns([column], value),
      onSaved: (savedItem, originalRow) => {
        onSaved?.(savedItem, originalRow);
        closeEditModal();
      },
      title: formMode === 'create'
        ? global.t?.t(storeName, 'button', 'add')
        : global.t?.t(storeName, 'button', 'edit'),
    },
    columnMenu: {
      availableColumns,
      columns: columnsForTable,
      onClose: () => setIsColumnMenuOpen(false),
      onToggleColumn: toggleColumn,
      visible: isColumnMenuOpen,
      visibleColumns,
    },
    filtersModal: {
      applyLabel: global.t?.t(storeName, 'button', 'apply'),
      clearLabel: global.t?.t(storeName, 'button', 'clear'),
      columns: filterColumns,
      filters: resolvedFilters,
      getColumnLabel: column => {
        const fieldName = getColumnKey(column);

        return formatStoreColumnLabel({
          columns: columnsForTable,
          fieldName,
          fallbackLabel: column?.label || fieldName,
          storeName,
        });
      },
      getOptionsForColumn: resolvedGetOptionsForColumn,
      loadListOptionsForColumns,
      onChange: updateFilter,
      onApply: () => setIsFiltersModalOpen(false),
      onClear: () => commitFilters({}),
      onClose: () => setIsFiltersModalOpen(false),
      title: global.t?.t(storeName, 'label', 'filters'),
      visible: isFiltersModalOpen && hasTableFilters,
    },
    footer: {
      columns: columnsForTable,
      footerComponent,
      footerProps,
      resolvedTotalItemsText,
      shouldRenderCompactToolbarTotalItems,
      shouldRenderFooterBar,
      shouldRenderFooterTotalItems,
      summaryEntries,
    },
    hasTableFilters,
    isColumnMenuOpen,
    isFiltersModalOpen,
    onAdd: openAddForm,
    onOpenFilters: () => setIsFiltersModalOpen(true),
    searchModal: {
      onClose: () => setIsSearchModalOpen(false),
      visible: isSearchModalOpen,
    },
    toolbar: {
      onOpenSearchModal: () => setIsSearchModalOpen(true),
      resolvedTotalItemsText,
      searchAccessibilityLabel,
      searchProps,
      shouldCollapseToolbarSearch,
      shouldRenderCompactToolbarTotalItems,
      toolbarActions,
    },
    onToggleColumnMenu: () => setIsColumnMenuOpen(prev => !prev),
    onToggleViewMode: toggleViewMode,
    shouldRenderAddButton,
  });

  const renderFiltersModal = () => {
    return (
      <DefaultFiltersModal storeName={storeName} />
    );
  };

  const getColumnByField = useCallback(
    fieldName => columnsForTable.find(column => getColumnKey(column) === fieldName),
    [columnsForTable],
  );

  const buildRowHelpers = useCallback(
    row => {
      const openEdit = () => openEditModal(row);
      const openRow = typeof onRowPress === 'function' ? () => requestRowPress(row) : null;
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
            onSearchChange={value => loadListOptionsForColumns([column], value)}
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
      requestRowPress,
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
    const RowActionsComponent = rowActionsComponent;
    const customRowActions = hasCustomRowActions ? (
      <RowActionsComponent
        openEdit={helpers.openEdit}
        openRow={helpers.openRow}
        row={row}
      />
    ) : null;
    const editButton = hasEditAction ? (
      <TouchableOpacity
        style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
        activeOpacity={0.82}
        onPress={helpers.openEdit}>
        <Icon name="edit-2" size={14} color={tableMutedColor} />
      </TouchableOpacity>
    ) : null;

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
              {customRowActions}
              {editButton}
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
          <View style={styles.cardActionGroup}>
            {customRowActions}
            {editButton}
          </View>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = isTable => {
    return (
      <DefaultTableEmptyState
        emptyStateLabel={emptyStateLabel}
        isLoading={resolvedIsLoading}
        isTable={isTable}
        tableLayoutStyle={tableLayoutStyle}
        tableMutedColor={tableMutedColor}
      />
    );
  };

  const renderLoadingOverlay = () => {
    return (
      <DefaultTableLoadingOverlay
        isLoading={resolvedIsLoading}
        itemCount={sortedData.length}
        tableBorderColor={tableBorderColor}
        tableSurfaceColor={tableSurfaceColor}
      />
    );
  };

  const renderTableItem = ({ item: row, index }) => {
    const hasRowPress = typeof onRowPress === 'function';
    const RowComponent = hasRowPress ? TouchableOpacity : View;
    const rowStyleValue = resolveRowStyle(row, index);
    const rowPressProps = hasRowPress
      ? {
        activeOpacity: 0.84,
        onPress: () => requestRowPress(row),
      }
      : {};
    const rowBackgroundColor = index % 2 === 0 ? tableOddColor : tableEvenColor;
    const RowActionsComponent = rowActionsComponent;
    const customRowActions = hasCustomRowActions ? (
      <RowActionsComponent
        openEdit={() => openEditModal(row)}
        openRow={typeof onRowPress === 'function' ? () => requestRowPress(row) : null}
        row={row}
      />
    ) : null;
    const editButton = hasEditAction ? (
      <TouchableOpacity
        style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
        activeOpacity={0.82}
        onPress={() => openEditModal(row)}>
        <Icon name="edit-2" size={14} color={tableMutedColor} />
      </TouchableOpacity>
    ) : null;

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
          <View
            style={[
              styles.cell,
              styles.actionsCell,
              { minWidth: actionsCellWidth, width: actionsCellWidth, flexBasis: actionsCellWidth, maxWidth: actionsCellWidth },
            ]}
          >
            <View style={styles.rowActionsGroup}>
              {customRowActions}
              {editButton}
            </View>
          </View>
        ) : null}
      </RowComponent>
    );
  };

  const renderEditModal = () => {
    return (
      <DefaultEditModal storeName={storeName} />
    );
  };

  const renderColumnMenuModal = () => {
    return (
      <DefaultColumnMenu storeName={storeName} />
    );
  };

  const renderSearchModal = () => {
    return (
      <DefaultSearchModal storeName={storeName} />
    );
  };

  return (
    <View style={[styles.wrap, { borderColor: panelBorderColor, backgroundColor: panelBackgroundColor }]} onLayout={handleLayout}>
      <DefaultTableToolbar storeName={storeName} />

      {renderSearchModal()}
      {renderFiltersModal()}

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
                <View
                  style={[
                    styles.cell,
                    styles.actionsCell,
                    {
                      minWidth: actionsCellWidth,
                      width: actionsCellWidth,
                      flexBasis: actionsCellWidth,
                      maxWidth: actionsCellWidth,
                    },
                  ]}
                >
                  <Text style={[styles.headerText, { color: tableTextColor }]}>Acoes</Text>
                </View>
              ) : null}
            </View>

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

      <DefaultTableFooter storeName={storeName} />

      {renderColumnMenuModal()}
      {renderEditModal()}
    </View>
  );
};

export default DefaultTable;

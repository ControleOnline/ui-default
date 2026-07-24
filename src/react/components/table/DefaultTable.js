/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { getAllStores, useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import DefaultTableBody from './DefaultTableBody';
import DefaultEditModal from './DefaultEditModal';
import DefaultTableFooter from './DefaultTableFooter';
import DefaultTableToolbar from './DefaultTableToolbar';
import { setDefaultTableRuntime } from './DefaultTable.runtime';
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
  DEFAULT_COMPACT_BREAKPOINT,
  getColumnMinWidth,
  getSortField,
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
  toolbarActions = [],
  showColumnFiltersButton = true,
  showTotalItemsInFooter = true,
  showTotalItemsInCompactToolbar = false,
  showRowActions = true,
  rowStyle = null,
  sort = null,
  storeName = '',
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
      }),
    [columnsForTable, storedFiltersPreference],
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
    [autoFilters, autoSort?.direction, autoSort?.field, columnsForTable, pageSizeNumber, requestParamsSeed],
  );
  const autoQuerySignature = useMemo(
    () =>
      stableSerialize({
        filters: autoFilters,
        pageSize: pageSizeNumber,
        requestParams: requestParamsSeed,
        sort: autoSort,
      }),
    [autoFilters, autoSort, pageSizeNumber, requestParamsSeed],
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
      }),
    );
  }, [
    autoMode,
    columnsForTable,
    controlledFiltersSignature,
    hasStoredFiltersPreference,
    isFiltersControlled,
    onFilterChange,
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
  const resolvedTotalItems = store?.getters?.totalItems;
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

  setDefaultTableRuntime(storeName, {
    activeFilterCount,
    body: {
      actionsCellWidth,
      columns: columnsForTable,
      effectiveViewMode,
      emptyStateLabel,
      hasCustomRowActions,
      hasEditAction,
      hasRowActions,
      isLoading: resolvedIsLoading,
      onEditRow: openEditModal,
      onEndReached: handleEndReached,
      onMomentumScrollBegin,
      onRequestRowPress: typeof onRowPress === 'function' ? requestRowPress : null,
      onRequestSort: requestSort,
      onScrollBeginDrag,
      renderCard,
      renderValue: (row, column, fallback = '-') =>
        resolveCellText({ column, columns: columnsForTable, row, storeName }) || fallback,
      resolvedFilters,
      resolvedSort,
      rowActionsComponent,
      rowStyle,
      sortedData,
      tableBorderColor,
      tableColumns,
      tableEvenColor,
      tableHeaderColor,
      tableLayoutStyle,
      tableMutedColor,
      tableOddColor,
      tableSurfaceColor,
      tableTextColor,
    },
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
    columns: {
      onToggleColumn: toggleColumn,
      visibleColumns,
    },
    filters: {
      getOptionsForColumn: resolvedGetOptionsForColumn,
      loadListOptionsForColumns,
      onChange: updateFilter,
      onClear: () => commitFilters({}),
    },
    footer: {
      columns: columnsForTable,
      footerComponent,
      isCompactView,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      tableColumns,
    },
    input: {
      columns: columnsForTable,
      editingCell,
      getOptionsForColumn: resolvedGetOptionsForColumn,
      hasRowPress: typeof onRowPress === 'function',
      loadListOptionsForColumns,
      onCancelEditing: clearEdit,
      onSaveCell: saveCell,
      onStartEditing: beginEdit,
      savingCell,
    },
    hasTableFilters,
    onAdd: openAddForm,
    toolbar: {
      isCompactView,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      tableContainerWidth,
      toolbarActions,
      width,
    },
    onToggleViewMode: toggleViewMode,
    shouldRenderAddButton,
  });

  const renderEditModal = () => {
    return (
      <DefaultEditModal storeName={storeName} />
    );
  };

  return (
    <View style={[styles.wrap, { borderColor: panelBorderColor, backgroundColor: panelBackgroundColor }]} onLayout={handleLayout}>
      <DefaultTableToolbar storeName={storeName} />

      <DefaultTableBody storeName={storeName} />

      <DefaultTableFooter storeName={storeName} />

      {renderEditModal()}
    </View>
  );
};

export default DefaultTable;

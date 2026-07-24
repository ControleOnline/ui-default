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
import useDefaultTableTheme from './useDefaultTableTheme';
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
  ACTIONS_CELL_WIDTH,
  DEFAULT_COMPACT_BREAKPOINT,
  getColumnMinWidth,
  isObject,
  normalizeCollectionItems,
  resolveListActionName,
  resolveColumnListLoadParams,
  shouldIncludeColumn,
  stableSerialize,
} from './DefaultTable.utils';
import {
  persistTableFiltersPreference,
  persistTableViewModePreference,
  persistVisibleColumnsPreference,
  resolveDefaultTablePreferenceScope,
  resolveStoredTableFiltersPreference,
  resolveStoredTableViewModePreference,
  resolveStoredVisibleColumnsPreference,
  sanitizeTableFiltersPreference,
  sanitizeVisibleColumnsPreference,
} from '../../utils/tableVisibleColumnsPreferences';
import styles from './DefaultTable.styles';
import { useDefaultTablePagination } from './useDefaultTablePagination';
import {
  useDefaultTableSortedData,
  useDefaultTableSortState,
} from './useDefaultTableSorting';

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
  const loadedListStoresRef = useRef(new Set());
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
  const storeColumns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const columnsForTable = storeColumns.length > 0 ? storeColumns : columns;
  useEffect(() => {
    if (storeColumns.length > 0 || !Array.isArray(columns) || columns.length === 0) {
      return;
    }

    if (typeof resolvedActions.setColumns === 'function') {
      resolvedActions.setColumns(columns);
      return;
    }

    if (store?.getters) {
      store.getters.columns = columns;
    }
  }, [columns, resolvedActions, store, storeColumns.length]);
  useEffect(() => {
    if (data === undefined || !Array.isArray(data)) {
      return;
    }

    if (typeof resolvedActions.setItems === 'function') {
      resolvedActions.setItems(data);
      return;
    }

    if (store?.getters) {
      store.getters.items = data;
    }
  }, [data, resolvedActions, store]);
  const storeFilters = isObject(store?.getters?.filters) ? store.getters.filters : {};
  const requestParamsSeed = isObject(requestParams) ? requestParams : {};
  const hasCustomRowActions = typeof rowActionsComponent === 'function';
  const resolvedFilters = storeFilters;
  const { requestSort, resolvedSort } = useDefaultTableSortState({
    autoMode,
    columnsForTable,
    onSortChange,
    sort,
    tablePreferenceScope,
  });
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

  const resolvedTotalItems = store?.getters?.totalItems;
  const {
    buildRequestQuery,
    currentPage,
    handleEndReached,
    resolvedData,
    resolvedIsLoading,
  } = useDefaultTablePagination({
    autoMode,
    columnsForTable,
    data,
    filters: resolvedFilters,
    hasMore,
    isFocused,
    isLoading,
    onEndReached,
    pageSize,
    requestParams: requestParamsSeed,
    resolvedActions,
    resolvedSort,
    resolvedTotalItems,
    showError,
    store,
    storeName,
  });

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
  const debugFallbackParameters = useMemo(() => {
    if (autoMode) {
      return buildRequestQuery(currentPage || 1, false);
    }

    return {
      filters: resolvedFilters || {},
      requestParams: requestParamsSeed,
      sort: resolvedSort || null,
    };
  }, [autoMode, buildRequestQuery, currentPage, requestParamsSeed, resolvedFilters, resolvedSort]);
  const sortedData = useDefaultTableSortedData({
    resolvedData,
    resolvedSort,
    storeName,
    tableColumns,
  });

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

  const handleLayout = useCallback(event => {
    const nextWidth = Math.floor(event?.nativeEvent?.layout?.width || 0);
    if (nextWidth > 0) setTableContainerWidth(nextWidth);
  }, []);

  const defaultTableConfigs = useMemo(
    () => ({
      add,
      compactBreakpoint,
      debugFallbackParameters,
      effectiveViewMode,
      footerComponent,
      forceCardsOnCompact,
      getOptionsForColumn,
      initialViewMode,
      onAdd,
      onDataLoaded,
      onEditRow,
      onEndReached: handleEndReached,
      onMomentumScrollBegin,
      onRowPress,
      onSaved,
      onScrollBeginDrag,
      renderCard,
      requestSort,
      resolvedSort,
      rowActionsComponent,
      rowStyle,
      showRowActions,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      sortedData,
      toolbarActions,
      viewMode: effectiveViewMode,
    }),
    [
      add,
      compactBreakpoint,
      debugFallbackParameters,
      effectiveViewMode,
      footerComponent,
      forceCardsOnCompact,
      getOptionsForColumn,
      handleEndReached,
      initialViewMode,
      onAdd,
      onDataLoaded,
      onEditRow,
      onMomentumScrollBegin,
      onRowPress,
      onSaved,
      onScrollBeginDrag,
      renderCard,
      requestSort,
      resolvedSort,
      rowActionsComponent,
      rowStyle,
      showRowActions,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      sortedData,
      toolbarActions,
    ],
  );

  if (store?.getters) {
    if (storeColumns.length === 0 && Array.isArray(columns) && columns.length > 0) {
      store.getters.columns = columns;
    }
    if (data !== undefined && Array.isArray(data)) {
      store.getters.items = data;
    }
    store.getters.configs = defaultTableConfigs;
  }

  useEffect(() => {
    if (typeof resolvedActions.setConfigs === 'function') {
      resolvedActions.setConfigs(defaultTableConfigs);
      return;
    }

    if (store?.getters) {
      store.getters.configs = defaultTableConfigs;
    }
  }, [
    defaultTableConfigs,
    resolvedActions,
    store,
  ]);

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

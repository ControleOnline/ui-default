import React, { useEffect, useMemo, useRef } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { NavigationRouteContext, useIsFocused } from '@react-navigation/native';
import { useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import Icon from 'react-native-vector-icons/Feather';
import { normalizeText } from '../inputs/defaultInputUtils';
import { DEFAULT_COMPACT_BREAKPOINT, isObject, stableSerialize } from './DefaultTable.utils';
import {
  resolveDefaultTablePreferenceScope,
  resolveStoredTableFiltersPreference,
  resolveStoredTableViewModePreference,
  resolveStoredVisibleColumnsPreference,
  sanitizeTableFiltersPreference,
  sanitizeVisibleColumnsPreference,
} from '../../utils/tableVisibleColumnsPreferences';
import DefaultTableBody from './DefaultTableBody';
import DefaultTableFooter from './DefaultTableFooter';
import DefaultTableToolbar from './DefaultTableToolbar';
import styles from './DefaultTable.styles';
import { useDefaultTablePagination } from './useDefaultTablePagination';
import {
  useDefaultTableSortedData,
  useDefaultTableSortState,
} from './useDefaultTableSorting';
import useDefaultTableTheme from './useDefaultTableTheme';

export {
  mergeSortedDataWithLiveItems,
  resolveColumnListLoadParams,
  shouldTriggerEndReachedFromScroll,
} from './DefaultTable.utils';

const publishStoreValue = (store, actionName, value, getterName) => {
  if (typeof store?.actions?.[actionName] === 'function') {
    store.actions[actionName](value);
    return;
  }

  if (store?.getters) {
    store.getters[getterName] = value;
  }
};

const assignGetterValue = (store, getterName, value) => {
  if (store?.getters) {
    store.getters[getterName] = value;
  }
};

const DefaultTable = ({
  accentColor = null,
  actions = {},
  add = null,
  addButtonPlacement = 'toolbar',
  addLabel = '',
  compactBreakpoint = DEFAULT_COMPACT_BREAKPOINT,
  cardListProps = {},
  columns = [],
  data = undefined,
  defaultColor = '',
  filters = {},
  footerComponent = null,
  forceCardsOnCompact = true,
  getOptionsForColumn = null,
  hasMore = null,
  initialViewMode = 'table',
  isLoading = false,
  onAdd = null,
  onDataLoaded = null,
  onEditRow = null,
  onEndReached = null,
  onFilterChange = null,
  onMomentumScrollBegin = null,
  onRowPress = null,
  onSaved = null,
  onScrollBeginDrag = null,
  onSortChange = null,
  pageSize = null,
  pinRowActions = true,
  renderCard = null,
  requestParams = {},
  rowActionsComponent = null,
  rowActionsWidth = null,
  rowStyle = null,
  searchKey = 'search',
  searchPlaceholder = '',
  showColumnFiltersButton = true,
  showSearch = null,
  showRowActions = true,
  showToolbar = true,
  showTotalItemsInCompactToolbar = false,
  showTotalItemsInFooter = true,
  sort = null,
  storeName = '',
  summary = undefined,
  summaryLabels = {},
  toolbarActions = [],
  visibleColumnsPreferenceKey = '',
}) => {
  const { width } = useWindowDimensions();
  const route = React.useContext(NavigationRouteContext);
  const store = useStore(storeName);
  const isFocused = useIsFocused();
  const configsSignatureRef = useRef('');
  const { showError } = useMessage() || {};
  const { tableBorderColors, themeColors } = useDefaultTableTheme(accentColor);
  const tablePanelBorderColor = tableBorderColors.containerBorderColor;
  const floatingAddBackgroundColor =
    themeColors.buttonBackground || themeColors.primary || accentColor;
  const floatingAddIconColor = themeColors.buttonText;
  const tablePreferenceScope = useMemo(
    () =>
      resolveDefaultTablePreferenceScope({
        preferenceKey: visibleColumnsPreferenceKey,
        route,
        storeName,
      }),
    [route?.key, route?.name, storeName, visibleColumnsPreferenceKey],
  );
  const storedViewMode = useMemo(
    () => resolveStoredTableViewModePreference(tablePreferenceScope, null),
    [initialViewMode, tablePreferenceScope],
  );
  const resolvedActions = useMemo(
    () => ({
      ...(store?.actions || {}),
      ...(actions || {}),
    }),
    [actions, store?.actions],
  );
  const autoMode = data === undefined && normalizeText(storeName) !== '';
  const storeColumns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const columnsForTable = storeColumns.length > 0 ? storeColumns : columns;
  const storeFilters = isObject(store?.getters?.filters) ? store.getters.filters : {};
  const requestParamsSeed = isObject(requestParams) ? requestParams : {};
  const resolvedTotalItems = store?.getters?.totalItems;
  const currentConfigs = store?.getters?.configs || {};
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const addConfig = store?.getters?.add;
  const normalizedAddButtonPlacement = normalizeText(addButtonPlacement) || 'toolbar';
  const hasAddAction =
    (addConfig === true || add === true) &&
    (typeof onAdd === 'function' || typeof store?.actions?.save === 'function');
  const shouldRenderFloatingAddButton =
    hasAddAction &&
    (normalizedAddButtonPlacement === 'floating' || showToolbar === false);
  const shouldRenderBottomAddButton =
    hasAddAction &&
    showToolbar !== false &&
    normalizedAddButtonPlacement === 'bottom';
  const resolvedAddLabel =
    normalizeText(addLabel) ||
    normalizeText(global.t?.t(storeName, 'button', 'add')) ||
    'Adicionar';

  if (storeColumns.length === 0 && Array.isArray(columns) && columns.length > 0) {
    assignGetterValue(store, 'columns', columns);
  }

  if (data !== undefined && Array.isArray(data)) {
    assignGetterValue(store, 'items', data);
  }

  const { requestSort, resolvedSort } = useDefaultTableSortState({
    autoMode,
    columnsForTable,
    onSortChange,
    sort,
    tablePreferenceScope,
  });
  const {
    buildRequestQuery,
    currentPage,
    handleEndReached,
    resolvedData,
  } = useDefaultTablePagination({
    autoMode,
    columnsForTable,
    data,
    filters: storeFilters,
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
  const sortedData = useDefaultTableSortedData({
    resolvedData,
    resolvedSort,
    storeName,
    tableColumns: columnsForTable,
  });
  const debugFallbackParameters = useMemo(() => {
    if (autoMode) {
      return buildRequestQuery(currentPage || 1, false);
    }

    return {
      filters: storeFilters,
      requestParams: requestParamsSeed,
      sort: resolvedSort || null,
    };
  }, [autoMode, buildRequestQuery, currentPage, requestParamsSeed, resolvedSort, storeFilters]);
  const effectiveViewMode =
    currentConfigs.viewMode ||
    storedViewMode ||
    (isCompactView && forceCardsOnCompact !== false ? 'cards' : initialViewMode);
  const tableFiltersVisible = Boolean(currentConfigs.tableFiltersVisible);
  const defaultTableConfigs = useMemo(
    () => ({
      add,
      addButtonPlacement: normalizedAddButtonPlacement,
      addLabel: resolvedAddLabel,
      cardListProps,
      compactBreakpoint,
      debugFallbackParameters,
      defaultColor,
      effectiveViewMode,
      filters,
      footerComponent,
      forceCardsOnCompact,
      getOptionsForColumn,
      initialViewMode,
      onAdd,
      onDataLoaded,
      onEditRow,
      onEndReached: handleEndReached,
      onFilterChange,
      onMomentumScrollBegin,
      onRowPress,
      onSaved,
      onScrollBeginDrag,
      pinRowActions,
      renderCard,
      requestParams: requestParamsSeed,
      requestSort,
      resolvedSort,
      rowActionsComponent,
      rowActionsWidth,
      rowStyle,
      searchKey,
      searchPlaceholder,
      showColumnFiltersButton,
      showSearch,
      showRowActions,
      showToolbar,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      sortedData,
      summary,
      summaryLabels,
      tableFiltersVisible,
      tablePreferenceScope,
      toolbarActions,
      viewMode: effectiveViewMode,
    }),
    [
      add,
      normalizedAddButtonPlacement,
      resolvedAddLabel,
      cardListProps,
      compactBreakpoint,
      debugFallbackParameters,
      defaultColor,
      effectiveViewMode,
      filters,
      footerComponent,
      forceCardsOnCompact,
      getOptionsForColumn,
      handleEndReached,
      initialViewMode,
      onAdd,
      onDataLoaded,
      onEditRow,
      onFilterChange,
      onMomentumScrollBegin,
      onRowPress,
      onSaved,
      onScrollBeginDrag,
      pinRowActions,
      renderCard,
      requestParamsSeed,
      requestSort,
      resolvedSort,
      rowActionsComponent,
      rowActionsWidth,
      rowStyle,
      searchKey,
      searchPlaceholder,
      showColumnFiltersButton,
      showSearch,
      showRowActions,
      showToolbar,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      sortedData,
      summary,
      summaryLabels,
      tableFiltersVisible,
      tablePreferenceScope,
      toolbarActions,
    ],
  );
  const defaultTableConfigsSignature = useMemo(
    () =>
      stableSerialize({
        add,
        addButtonPlacement: normalizedAddButtonPlacement,
        addLabel: resolvedAddLabel,
        cardListProps,
        compactBreakpoint,
        defaultColor,
        effectiveViewMode,
        filters,
        forceCardsOnCompact,
        initialViewMode,
        pinRowActions,
        rowActionsComponentType: rowActionsComponent ? typeof rowActionsComponent : '',
        rowActionsWidth,
        resolvedSort,
        searchKey,
        searchPlaceholder,
        showColumnFiltersButton,
        showSearch,
        showRowActions,
        showToolbar,
        showTotalItemsInCompactToolbar,
        showTotalItemsInFooter,
        storedViewMode,
        tableFiltersVisible,
        sortedDataLength: sortedData.length,
        toolbarActionsLength: Array.isArray(toolbarActions) ? toolbarActions.length : 0,
      }),
    [
      add,
      normalizedAddButtonPlacement,
      resolvedAddLabel,
      cardListProps,
      compactBreakpoint,
      defaultColor,
      debugFallbackParameters,
      effectiveViewMode,
      filters,
      forceCardsOnCompact,
      initialViewMode,
      pinRowActions,
      rowActionsComponent,
      rowActionsWidth,
      resolvedSort,
      searchKey,
      searchPlaceholder,
      showColumnFiltersButton,
      showSearch,
      showRowActions,
      showToolbar,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      storedViewMode,
      tableFiltersVisible,
      sortedData.length,
      toolbarActions,
    ],
  );

  if (store?.getters) {
    assignGetterValue(store, 'configs', defaultTableConfigs);
  }

  useEffect(() => {
    if (storeColumns.length > 0 || !Array.isArray(columns) || columns.length === 0) {
      return;
    }

    publishStoreValue(store, 'setColumns', columns, 'columns');
  }, [columns, store, storeColumns.length]);

  useEffect(() => {
    if (data === undefined || !Array.isArray(data)) {
      return;
    }

    publishStoreValue(store, 'setItems', data, 'items');
  }, [data, store]);

  useEffect(() => {
    if (!columnsForTable.length) {
      return;
    }

    const storedVisibleColumns = resolveStoredVisibleColumnsPreference(tablePreferenceScope);
    if (!storedVisibleColumns) {
      return;
    }

    const nextVisibleColumns = sanitizeVisibleColumnsPreference({
      columns: columnsForTable,
      visibleColumns: storedVisibleColumns,
    });
    const currentVisibleColumns = store?.getters?.visibleColumns || {};

    if (stableSerialize(currentVisibleColumns) === stableSerialize(nextVisibleColumns)) {
      return;
    }

    publishStoreValue(store, 'setVisibleColumns', nextVisibleColumns, 'visibleColumns');
  }, [columnsForTable, store, tablePreferenceScope]);

  useEffect(() => {
    if (!columnsForTable.length || Object.keys(storeFilters).length > 0) {
      return;
    }

    const storedFilters = resolveStoredTableFiltersPreference(tablePreferenceScope);
    if (!storedFilters) {
      return;
    }

    const nextFilters = sanitizeTableFiltersPreference({
      columns: columnsForTable,
      filters: storedFilters,
    });

    if (Object.keys(nextFilters).length === 0) {
      return;
    }

    publishStoreValue(store, 'setFilters', nextFilters, 'filters');
  }, [columnsForTable, store, storeFilters, tablePreferenceScope]);

  useEffect(() => {
    if (configsSignatureRef.current === defaultTableConfigsSignature) {
      return;
    }

    configsSignatureRef.current = defaultTableConfigsSignature;
    publishStoreValue(store, 'setConfigs', defaultTableConfigs, 'configs');
  }, [defaultTableConfigs, defaultTableConfigsSignature, store]);

  useEffect(() => {
    onDataLoaded?.(sortedData);
  }, [onDataLoaded, sortedData]);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderWidth: tablePanelBorderColor ? 1 : 0,
          borderColor: tablePanelBorderColor,
          backgroundColor: themeColors.panelBackground,
        },
      ]}
    >
      {showToolbar !== false ? <DefaultTableToolbar storeName={storeName} /> : null}
      <DefaultTableBody storeName={storeName} />
      <DefaultTableFooter storeName={storeName} />
      {shouldRenderBottomAddButton ? (
        <View style={styles.bottomAddBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={resolvedAddLabel}
            activeOpacity={0.84}
            style={[
              styles.bottomAddButton,
              { backgroundColor: floatingAddBackgroundColor },
            ]}
            onPress={() => onAdd?.()}
          >
            <Icon name="plus" size={18} color={floatingAddIconColor} />
            <Text style={[styles.bottomAddText, { color: floatingAddIconColor }]}>
              {resolvedAddLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {shouldRenderFloatingAddButton ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={resolvedAddLabel}
          activeOpacity={0.84}
          style={[
            styles.floatingAddButton,
            { backgroundColor: floatingAddBackgroundColor },
          ]}
          onPress={() => onAdd?.()}
        >
          <Icon name="plus" size={24} color={floatingAddIconColor} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default DefaultTable;

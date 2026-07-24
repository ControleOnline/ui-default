import React, { useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { normalizeText } from '../inputs/defaultInputUtils';
import { DEFAULT_COMPACT_BREAKPOINT, isObject } from './DefaultTable.utils';
import { resolveDefaultTablePreferenceScope } from '../../utils/tableVisibleColumnsPreferences';
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

export { resolveColumnListLoadParams } from './DefaultTable.utils';

const publishStoreValue = (store, actionName, value, getterName) => {
  if (typeof store?.actions?.[actionName] === 'function') {
    store.actions[actionName](value);
    return;
  }

  if (store?.getters) {
    store.getters[getterName] = value;
  }
};

const DefaultTable = ({
  accentColor = null,
  actions = {},
  add = null,
  compactBreakpoint = DEFAULT_COMPACT_BREAKPOINT,
  columns = [],
  data = undefined,
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
  renderCard = null,
  requestParams = {},
  rowActionsComponent = null,
  rowStyle = null,
  showColumnFiltersButton = true,
  showRowActions = true,
  showTotalItemsInCompactToolbar = false,
  showTotalItemsInFooter = true,
  sort = null,
  storeName = '',
  toolbarActions = [],
  visibleColumnsPreferenceKey = '',
}) => {
  const { width } = useWindowDimensions();
  const route = useRoute?.();
  const store = useStore(storeName);
  const isFocused = useIsFocused();
  const { showError } = useMessage() || {};
  const { themeColors } = useDefaultTableTheme(accentColor);
  const tablePreferenceScope = useMemo(
    () =>
      resolveDefaultTablePreferenceScope({
        preferenceKey: visibleColumnsPreferenceKey,
        route,
        storeName,
      }),
    [route?.key, route?.name, storeName, visibleColumnsPreferenceKey],
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

  if (storeColumns.length === 0 && Array.isArray(columns) && columns.length > 0) {
    publishStoreValue(store, 'setColumns', columns, 'columns');
  }

  if (data !== undefined && Array.isArray(data)) {
    publishStoreValue(store, 'setItems', data, 'items');
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
    isCompactView && forceCardsOnCompact !== false
      ? (currentConfigs.viewMode || 'cards')
      : (currentConfigs.viewMode || initialViewMode);
  const defaultTableConfigs = useMemo(
    () => ({
      add,
      compactBreakpoint,
      debugFallbackParameters,
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
      renderCard,
      requestSort,
      resolvedSort,
      rowActionsComponent,
      rowStyle,
      showColumnFiltersButton,
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
      renderCard,
      requestSort,
      resolvedSort,
      rowActionsComponent,
      rowStyle,
      showColumnFiltersButton,
      showRowActions,
      showTotalItemsInCompactToolbar,
      showTotalItemsInFooter,
      sortedData,
      toolbarActions,
    ],
  );

  if (store?.getters) {
    store.getters.configs = defaultTableConfigs;
  }

  useEffect(() => {
    publishStoreValue(store, 'setConfigs', defaultTableConfigs, 'configs');
  }, [defaultTableConfigs, store]);

  useEffect(() => {
    onDataLoaded?.(sortedData);
  }, [onDataLoaded, sortedData]);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: themeColors.panelBorder,
          backgroundColor: themeColors.panelBackground,
        },
      ]}
    >
      <DefaultTableToolbar storeName={storeName} />
      <DefaultTableBody storeName={storeName} />
      <DefaultTableFooter storeName={storeName} />
    </View>
  );
};

export default DefaultTable;

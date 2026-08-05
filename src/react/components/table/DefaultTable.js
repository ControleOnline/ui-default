import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
import DefaultForm from '../form/DefaultForm';
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
  importAction = null,
  initialViewMode = 'table',
  isLoading = false,
  exportAction = null,
  onAdd = null,
  onDataLoaded = null,
  onEditRow = null,
  onEndReached = null,
  onExport = null,
  onFilterChange = null,
  onImport = null,
  onMomentumScrollBegin = null,
  onRefresh = null,
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
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { width } = useWindowDimensions();
  const route = React.useContext(NavigationRouteContext);
  const store = useStore(storeName);
  const peopleStore = useStore('people');
  const isFocused = useIsFocused();
  const configsSignatureRef = useRef('');
  const storeDeclaredConfigsRef = useRef(null);
  const { showError } = useMessage() || {};
  const { tableBorderColors, themeColors } = useDefaultTableTheme(accentColor);
  const tablePanelBorderColor = tableBorderColors.containerBorderColor;
  const floatingAddBackgroundColor =
    themeColors.buttonBackground || themeColors.primary || accentColor;
  const floatingAddIconColor = themeColors.buttonText;
  const currentCompanyId = peopleStore?.getters?.currentCompany?.id;
  const tablePreferenceScope = useMemo(
    () =>
      resolveDefaultTablePreferenceScope({
        companyId: currentCompanyId,
        preferenceKey: visibleColumnsPreferenceKey,
        route,
        storeName,
      }),
    [currentCompanyId, route?.key, route?.name, storeName, visibleColumnsPreferenceKey],
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
  if (storeDeclaredConfigsRef.current === null) {
    storeDeclaredConfigsRef.current = isObject(store?.getters?.configs)
      ? store.getters.configs
      : {};
  }

  const storeDeclaredConfigs = storeDeclaredConfigsRef.current || {};
  const currentConfigs = {
    ...storeDeclaredConfigs,
    ...(store?.getters?.configs || {}),
  };
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const addConfig = store?.getters?.add;
  const normalizedAddButtonPlacement = normalizeText(addButtonPlacement) || 'toolbar';
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
    handleRefresh,
    resolvedData,
    resolvedIsRefreshing,
  } = useDefaultTablePagination({
    autoMode,
    columnsForTable,
    data,
    filters: storeFilters,
    hasMore,
    isFocused,
    isLoading,
    onEndReached,
    onRefresh,
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
  const closeCreateForm = useCallback(() => setIsCreateFormOpen(false), []);
  const canUseDefaultCreateForm = typeof resolvedActions?.save === 'function';
  const handleAdd = useCallback(() => {
    if (typeof onAdd === 'function') {
      return onAdd();
    }

    if (!canUseDefaultCreateForm) {
      return null;
    }

    setIsCreateFormOpen(true);
    return null;
  }, [canUseDefaultCreateForm, onAdd]);
  const resolvedOnAdd = typeof onAdd === 'function' || canUseDefaultCreateForm
    ? handleAdd
    : null;
  const hasAddAction =
    (addConfig === true || add === true) &&
    typeof resolvedOnAdd === 'function';
  const shouldRenderFloatingAddButton =
    hasAddAction &&
    (normalizedAddButtonPlacement === 'floating' || showToolbar === false);
  const shouldRenderBottomAddButton =
    hasAddAction &&
    showToolbar !== false &&
    normalizedAddButtonPlacement === 'bottom';
  const handleDefaultCreateSaved = useCallback(
    savedItem => {
      closeCreateForm();
      onSaved?.(savedItem, null);
      handleRefresh?.();
    },
    [closeCreateForm, handleRefresh, onSaved],
  );
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
      ...storeDeclaredConfigs,
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
      import: storeDeclaredConfigs.import,
      importAction,
      initialViewMode,
      exportAction,
      onAdd: resolvedOnAdd,
      onDataLoaded,
      onEditRow,
      onEndReached: handleEndReached,
      onExport,
      onFilterChange,
      onImport,
      onMomentumScrollBegin,
      onRefresh: handleRefresh,
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
      refreshing: resolvedIsRefreshing,
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
      handleRefresh,
      resolvedOnAdd,
      storeDeclaredConfigs,
      importAction,
      initialViewMode,
      exportAction,
      onDataLoaded,
      onEditRow,
      onExport,
      onFilterChange,
      onImport,
      onMomentumScrollBegin,
      onRefresh,
      onRowPress,
      onSaved,
      onScrollBeginDrag,
      pinRowActions,
      renderCard,
      requestParamsSeed,
      requestSort,
      resolvedIsRefreshing,
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
        configuredImport: storeDeclaredConfigs.import || null,
        add,
        addButtonPlacement: normalizedAddButtonPlacement,
        addLabel: resolvedAddLabel,
        cardListProps,
        compactBreakpoint,
        defaultColor,
        effectiveViewMode,
        filters,
        forceCardsOnCompact,
        hasExportAction: Boolean(exportAction || onExport),
        hasImportAction: Boolean(storeDeclaredConfigs.import || importAction || onImport),
        initialViewMode,
        pinRowActions,
        rowActionsComponentType: rowActionsComponent ? typeof rowActionsComponent : '',
        rowActionsWidth,
        resolvedIsRefreshing,
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
      storeDeclaredConfigs,
      exportAction,
      importAction,
      initialViewMode,
      onExport,
      onImport,
      pinRowActions,
      rowActionsComponent,
      rowActionsWidth,
      resolvedIsRefreshing,
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
            onPress={resolvedOnAdd}
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
          onPress={resolvedOnAdd}
        >
          <Icon name="plus" size={24} color={floatingAddIconColor} />
        </TouchableOpacity>
      ) : null}
      <Modal
        animationType="fade"
        onRequestClose={closeCreateForm}
        transparent
        visible={isCreateFormOpen}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{resolvedAddLabel}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={global.t?.t(storeName, 'button', 'cancel') || 'Cancelar'}
                onPress={closeCreateForm}
                style={styles.modalCloseButton}
              >
                <Icon name="x" size={16} color={themeColors.textPrimary || '#0F172A'} />
              </TouchableOpacity>
            </View>
            <DefaultForm
              actions={resolvedActions}
              columns={columnsForTable}
              getOptionsForColumn={getOptionsForColumn}
              mode="create"
              onCancel={closeCreateForm}
              onSaved={handleDefaultCreateSaved}
              row={requestParamsSeed}
              storeName={storeName}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DefaultTable;

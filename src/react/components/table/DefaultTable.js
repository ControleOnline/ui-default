import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
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
  resolveCellText,
  resolveEditValue,
} from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';

const DEFAULT_CELL_MIN_WIDTH = 118;
const DEFAULT_COMPACT_BREAKPOINT = 768;
const END_REACHED_THRESHOLD = 0.35;
const IDENTITY_CELL_MIN_WIDTH = 76;
const MONEY_CELL_MIN_WIDTH = 132;
const ACTIONS_CELL_WIDTH = 60;
const SUMMARY_OPERATIONS = ['sum', 'count', 'avg', 'min', 'max'];

const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.visible !== false &&
  column?.table !== false;

const isObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getRowKey = (row, index = 0) =>
  String(row?.['@id'] || row?.id || index);

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
  accentColor = '#2563EB',
  actions = {},
  add = null,
  compactBreakpoint = DEFAULT_COMPACT_BREAKPOINT,
  columns = [],
  data = [],
  filters = {},
  getOptionsForColumn = null,
  hasMore = null,
  initialViewMode = 'table',
  isLoading = false,
  onEditRow = null,
  onEndReached = null,
  onAdd = null,
  onFilterChange = null,
  onRowPress = null,
  onSaved = null,
  onSortChange = null,
  renderCard = null,
  searchProps = null,
  toolbarActions = [],
  showColumnFiltersButton = true,
  showRowActions = true,
  sort = null,
  storeName = '',
  summary = null,
  summaryLabels = null,
  totalItems = null,
  totalItemsLabel = null,
}) => {
  const { width } = useWindowDimensions();
  const store = useStore(storeName);
  const [editingCell, setEditingCell] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formMode, setFormMode] = useState('edit');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const endReachedLockRef = useRef(false);
  const previousPaginationStateRef = useRef({
    dataLength: Array.isArray(data) ? data.length : 0,
    filtersKey: JSON.stringify(filters || {}),
    sortDirection: sort?.direction,
    sortField: sort?.field,
  });
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((acc, column) => {
      const key = getColumnKey(column);
      if (key) acc[key] = column?.visible !== false;
      return acc;
    }, {}),
  );

  const availableColumns = useMemo(
    () => columns.filter(column => Boolean(getColumnKey(column)) && column?.table !== false),
    [columns],
  );

  const tableColumns = useMemo(
    () => columns.filter(column => shouldIncludeColumn(column) && visibleColumns[getColumnKey(column)] !== false),
    [columns, visibleColumns],
  );

  const editableColumns = useMemo(
    () => tableColumns.filter(isEditableColumn),
    [tableColumns],
  );

  const activeFilterCount = useMemo(
    () => Object.values(filters || {}).filter(value => normalizeText(value) !== '').length,
    [filters],
  );
  const hasRowActions = showRowActions !== false;
  const storeAddConfig = store?.getters?.add;
  const addConfig = add !== null && add !== undefined ? add : storeAddConfig;
  const hasAddInstruction = addConfig === true || (isObject(addConfig) && addConfig.enabled !== false);
  const shouldRenderAddButton =
    hasAddInstruction &&
    (typeof onAdd === 'function' || typeof actions.save === 'function');
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
  const effectiveViewMode = isCompactView ? 'cards' : viewMode;
  const emptyStateLabel = isLoading
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
  const totalItemsText = shouldRenderTotalItems
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
        columns,
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
  }, [columns, resolvedSummary, shouldReadSummary, storeName, summaryLabels, tableColumns]);
  const shouldRenderFooterBar = shouldRenderTotalItems || summaryEntries.length > 0;

  const sortedData = useMemo(() => {
    const items = Array.isArray(data) ? [...data] : [];
    const sortField = sort?.field;
    const sortDirection = sort?.direction === 'desc' ? 'desc' : 'asc';
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
  }, [data, sort?.direction, sort?.field, storeName, tableColumns]);

  const resolvedHasMore = useMemo(
    () =>
      resolveHasMore({
        hasMore,
        dataLength: sortedData.length,
        totalItems: resolvedTotalItems,
      }),
    [hasMore, resolvedTotalItems, sortedData.length],
  );

  useEffect(() => {
    const nextPaginationState = {
      dataLength: sortedData.length,
      filtersKey: JSON.stringify(filters || {}),
      sortDirection: sort?.direction,
      sortField: sort?.field,
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
  }, [filters, sort?.direction, sort?.field, sortedData]);

  const beginEdit = useCallback((row, column) => {
    if (!isEditableColumn(column)) return;
    setEditingCell(`${row?.id || row?.['@id']}:${getColumnKey(column)}`);
  }, []);

  const clearEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const saveCell = useCallback((row, column, nextValue) => {
    const fieldName = getColumnKey(column);
    if (!fieldName || typeof actions.save !== 'function') {
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

    return actions.save(payload)
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
  }, [actions, clearEdit, onSaved]);

  const requestSort = useCallback(column => {
    if (!isSortableColumn(column)) return;

    const fieldName = getSortField(column);
    const nextDirection =
      sort?.field === fieldName && sort?.direction === 'asc'
        ? 'desc'
        : 'asc';

    onSortChange?.({
      direction: nextDirection,
      field: fieldName,
    });
  }, [onSortChange, sort?.direction, sort?.field]);

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

    if (typeof actions.save !== 'function') return;

    setFormMode('create');
    setEditingRow({});
  }, [actions, onAdd]);

  const closeEditModal = useCallback(() => {
    setEditingRow(null);
    setFormMode('edit');
  }, []);

  const updateFilter = useCallback((fieldName, value) => {
    const nextFilters = { ...(filters || {}) };
    const isEmpty =
      value === null ||
      value === undefined ||
      normalizeText(value) === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) delete nextFilters[fieldName];
    else nextFilters[fieldName] = value;

    onFilterChange?.(nextFilters);
  }, [filters, onFilterChange]);

  const toggleColumn = useCallback(column => {
    const fieldName = getColumnKey(column);
    if (!fieldName) return;

    setVisibleColumns(prev => {
      const next = { ...prev, [fieldName]: prev[fieldName] === false };
      actions?.setVisibleColumns?.(next);
      return next;
    });
  }, [actions]);

  const handleEndReached = useCallback(() => {
    if (
      !resolvedHasMore ||
      isLoading ||
      typeof onEndReached !== 'function' ||
      endReachedLockRef.current === true
    ) {
      return;
    }

    endReachedLockRef.current = true;
    onEndReached();
  }, [endReachedLockRef, isLoading, onEndReached, resolvedHasMore]);

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
          accentColor={accentColor}
          column={column}
          columns={columns}
          editing={isEditing}
          getOptionsForColumn={getOptionsForColumn}
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
        accentColor={accentColor}
        column={column}
        filters={filters}
        getOptionsForColumn={getOptionsForColumn}
        onChange={updateFilter}
        storeName={storeName}
        style={getColumnStyle(column)}
      />
    );
  };

  const renderToolbarAction = action => {
    if (!action || action.hidden) return null;

    const isActive = action.active === true;

    return (
      <TouchableOpacity
        key={action.key || action.icon || action.label}
        style={[
          styles.toolbarButton,
          isActive ? styles.toolbarButtonActive : null,
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
            color={action.color || (isActive ? accentColor : '#64748B')}
          />
        ) : null}
        {action.badge !== undefined && action.badge !== null ? (
          <Text style={[styles.toolbarBadgeText, { color: action.badgeColor || accentColor }]}>
            {action.badge}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const getColumnByField = useCallback(
    fieldName => columns.find(column => getColumnKey(column) === fieldName),
    [columns],
  );

  const buildRowHelpers = useCallback(
    row => {
      const openEdit = () => openEditModal(row);
      const openRow = typeof onRowPress === 'function' ? () => onRowPress(row) : null;
      const renderValue = (fieldName, fallback = '-') => {
        const column = getColumnByField(fieldName);
        if (!column) return fallback;
        return resolveCellText({ column, columns, row, storeName });
      };
      const renderField = (fieldName, options = {}) => {
        const column = getColumnByField(fieldName);
        if (!column) return null;

        const cellKey = `${row?.id || row?.['@id']}:${fieldName}`;
        const isEditing = editingCell === cellKey;
        const isSaving = savingCell === cellKey;

        return (
          <DefaultInput
            accentColor={options.accentColor || accentColor}
            column={column}
            columns={columns}
            containerStyle={options.containerStyle}
            displayValue={options.displayValue}
            editing={isEditing}
            getOptionsForColumn={getOptionsForColumn}
            inputStyle={options.inputStyle}
            label={options.label}
            numberOfLines={options.numberOfLines}
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
      accentColor,
      beginEdit,
      clearEdit,
      columns,
      editingCell,
      getColumnByField,
      getOptionsForColumn,
      openEditModal,
      onRowPress,
      saveCell,
      savingCell,
      storeName,
    ],
  );

  const renderCardItem = row => {
    const helpers = buildRowHelpers(row);

    if (typeof renderCard === 'function') {
      return (
        <View key={row?.['@id'] || row?.id} style={styles.cardItem}>
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
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.82} onPress={helpers.openEdit}>
                <Icon name="edit-2" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    }

    return (
      <View key={row?.['@id'] || row?.id} style={styles.defaultCard}>
        {tableColumns.map(column => (
          <View key={getColumnKey(column)} style={styles.defaultCardLine}>
            <Text style={styles.defaultCardLabel}>
              {formatStoreColumnLabel({
                columns,
                fieldName: getColumnKey(column),
                fallbackLabel: column?.label || getColumnKey(column),
                storeName,
              })}
            </Text>
            {helpers.renderField(getColumnKey(column), {
              readTextStyle: styles.defaultCardValue,
              numberOfLines: 1,
            })}
          </View>
        ))}
        {hasRowActions ? (
          <TouchableOpacity style={styles.cardEditButton} activeOpacity={0.82} onPress={helpers.openEdit}>
            <Icon name="edit-2" size={14} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = isTable => {
    const emptyState = (
      <View style={[styles.emptyBox, isTable ? tableLayoutStyle : null]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : null}
        <Text style={styles.emptyText}>{emptyStateLabel}</Text>
      </View>
    );

    return emptyState;
  };

  const renderLoadingFooter = () => {
    if (!isLoading || sortedData.length === 0) {
      return null;
    }

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={accentColor} />
        <Text style={styles.emptyText}>Carregando mais registros...</Text>
      </View>
    );
  };

  const renderTableItem = ({ item: row }) => {
    const hasRowPress = typeof onRowPress === 'function';
    const RowComponent = hasRowPress ? TouchableOpacity : View;
    const rowPressProps = hasRowPress
      ? {
        activeOpacity: 0.84,
        onPress: () => onRowPress(row),
      }
      : {};

    return (
      <RowComponent
        key={getRowKey(row)}
        style={[styles.row, tableLayoutStyle]}
        {...rowPressProps}
      >
        {tableColumns.map(column => (
          <React.Fragment key={getColumnKey(column)}>
            {renderEditableCell(row, column)}
          </React.Fragment>
        ))}
        {hasRowActions ? (
          <View style={[styles.cell, styles.actionsCell]}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.82} onPress={() => openEditModal(row)}>
              <Icon name="edit-2" size={14} color="#64748B" />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCreate
                  ? global.t?.t(storeName, 'button', 'add') || 'Adicionar'
                  : global.t?.t(storeName, 'button', 'edit') || 'Editar'}
              </Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeEditModal}>
                <Icon name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <DefaultForm
              accentColor={accentColor}
              actions={actions}
              columns={isCreate ? columns : editableColumns}
              getOptionsForColumn={getOptionsForColumn}
              mode={formMode}
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

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          {searchProps ? (
            <DefaultSearch
              accentColor={accentColor}
              compact
              storeName={storeName}
              {...searchProps}
              style={[styles.toolbarSearch, searchProps?.style]}
            />
          ) : null}
          {showColumnFiltersButton ? (
            <TouchableOpacity
              style={[styles.toolbarButton, showColumnFilters ? styles.toolbarButtonActive : null]}
              activeOpacity={0.82}
              onPress={() => setShowColumnFilters(prev => !prev)}
            >
              <Icon name="filter" size={14} color={showColumnFilters ? accentColor : '#64748B'} />
              {activeFilterCount > 0 ? (
                <Text style={[styles.toolbarBadgeText, { color: accentColor }]}>{activeFilterCount}</Text>
              ) : null}
            </TouchableOpacity>
          ) : null}
          {!isCompactView ? (
            <TouchableOpacity
              style={styles.toolbarButton}
              activeOpacity={0.82}
              onPress={() => setViewMode(prev => (prev === 'table' ? 'cards' : 'table'))}
            >
              <Icon name={viewMode === 'table' ? 'grid' : 'list'} size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.82} onPress={() => setIsColumnMenuOpen(prev => !prev)}>
            <Icon name="columns" size={14} color="#64748B" />
          </TouchableOpacity>
          {shouldRenderAddButton ? (
            <TouchableOpacity
              style={[styles.toolbarButton, styles.toolbarAddButton, { backgroundColor: accentColor, borderColor: accentColor }]}
              activeOpacity={0.85}
              onPress={openAddForm}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          {Array.isArray(toolbarActions) ? toolbarActions.map(renderToolbarAction) : null}
        </View>

        {isColumnMenuOpen ? (
          <View style={styles.columnMenu}>
            {availableColumns.map(column => {
              const fieldName = getColumnKey(column);
              const label = formatStoreColumnLabel({
                columns,
                fieldName,
                fallbackLabel: column?.label || fieldName,
                storeName,
              });
              const checked = visibleColumns[fieldName] !== false;

              return (
                <TouchableOpacity key={fieldName} style={styles.columnMenuItem} activeOpacity={0.82} onPress={() => toggleColumn(column)}>
                  <Icon name={checked ? 'check-square' : 'square'} size={14} color="#64748B" />
                  <Text style={styles.columnMenuText} numberOfLines={1}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      {effectiveViewMode === 'cards' ? (
        <FlatList
          data={sortedData}
          keyExtractor={getRowKey}
          renderItem={({ item }) => renderCardItem(item)}
          style={styles.cardsScroll}
          contentContainerStyle={styles.cardsGrid}
          ListEmptyComponent={renderEmptyState(false)}
          ListFooterComponent={renderLoadingFooter()}
          nestedScrollEnabled
          onEndReached={handleEndReached}
          onEndReachedThreshold={END_REACHED_THRESHOLD}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView horizontal style={styles.scroll}>
          <View style={[styles.content, tableLayoutStyle]}>
            <View style={[styles.headerRow, tableLayoutStyle]}>
              {tableColumns.map(column => {
                const fieldName = getColumnKey(column);
                const label = formatStoreColumnLabel({
                  columns,
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
                      <Text style={styles.headerText} numberOfLines={1}>{label}</Text>
                      {isSortableColumn(column) && sort?.field === sortFieldName ? (
                        <Icon name={sort?.direction === 'desc' ? 'chevron-down' : 'chevron-up'} size={12} color="#64748B" />
                      ) : isSortableColumn(column) ? (
                        <Icon name="chevrons-up" size={12} color="#CBD5E1" />
                      ) : null}
                      {filters?.[fieldName] ? <Icon name="filter" size={11} color={accentColor} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {hasRowActions ? (
                <View style={[styles.cell, styles.actionsCell]}>
                  <Text style={styles.headerText}>Acoes</Text>
                </View>
              ) : null}
            </View>

            {showColumnFiltersButton && showColumnFilters ? (
              <View style={[styles.filterRow, tableLayoutStyle]}>
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
              ListFooterComponent={renderLoadingFooter()}
              nestedScrollEnabled
              onEndReached={handleEndReached}
              onEndReachedThreshold={END_REACHED_THRESHOLD}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      )}

      {shouldRenderFooterBar ? (
        <View style={styles.footerBar}>
          {summaryEntries.length > 0 ? (
            <View style={styles.footerSummaryList}>
              {summaryEntries.map(entry => (
                <View key={entry.key} style={styles.footerSummaryItem}>
                  <Text style={styles.footerSummaryLabel} numberOfLines={1}>
                    {entry.label}
                  </Text>
                  <Text
                    style={[
                      styles.footerSummaryValue,
                      entry.path?.[0] === 'sum' || isMoneySummaryPath(entry.path)
                        ? { color: accentColor }
                        : null,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {formatSummaryValue({
                      column: entry.column,
                      columns,
                      path: entry.path,
                      storeName,
                      value: entry.value,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {shouldRenderTotalItems ? (
            <View style={styles.footerCountPill}>
              <Text style={[styles.footerCountText, { color: accentColor }]} numberOfLines={1}>
                {totalItemsText}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {renderEditModal()}
    </View>
  );
};

export default DefaultTable;

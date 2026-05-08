import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getAllStores } from '@store';
import {
  formatStoreColumnLabel,
  formatStoreColumnValue,
} from '@controleonline/ui-common/src/react/utils/storeColumns';
import CompactFilterSelector from '../filters/CompactFilterSelector';
import DateShortcutFilter from '../filters/DateShortcutFilter';
import styles from './DefaultDataTable.styles';

const normalizeText = value => String(value ?? '').trim();
const getColumnKey = column => column?.key || column?.name || '';
const DEFAULT_CELL_MIN_WIDTH = 118;
const IDENTITY_CELL_MIN_WIDTH = 76;
const MONEY_CELL_MIN_WIDTH = 132;
const ACTIONS_CELL_WIDTH = 60;

const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.visible !== false &&
  column?.table !== false;

const isEditableColumn = column =>
  column?.editable !== false &&
  !column?.isIdentity &&
  column?.inputType !== 'increase' &&
  column?.inputType !== 'image' &&
  !String(getColumnKey(column)).includes('.');

const isSortableColumn = column => column?.sortable === true;

const normalizeId = value => {
  if (!value) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const match = value.match(/\d+/g);
    return match ? match[match.length - 1] : value;
  }
  return normalizeId(value?.id || value?.['@id'] || '');
};

const normalizeOptionKey = option => {
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

const resolveOptionLabel = (column, option) => {
  if (!option) return '';

  if (typeof column?.formatList === 'function') {
    const formatted = column.formatList(option, null, column);
    if (formatted && typeof formatted === 'object') {
      return normalizeText(formatted.label ?? formatted.value);
    }
    if (formatted) return normalizeText(formatted);
  }

  return normalizeText(
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
};

const resolveStoreNameFromList = list => normalizeText(list).split('/')[0] || '';

const mapOptions = (column, items = []) =>
  (Array.isArray(items) ? items : []).map(item => ({
    key: normalizeOptionKey(
      typeof column?.formatList === 'function'
        ? column.formatList(item, null, column)
        : item,
    ) || normalizeOptionKey(item),
    label: resolveOptionLabel(column, item) || '-',
    raw: item,
  }));

const buildOptionsFromColumn = (column, getOptionsForColumn = null) => {
  const explicitOptions = getOptionsForColumn?.(column);
  if (Array.isArray(explicitOptions) && explicitOptions.length > 0) {
    return mapOptions(column, explicitOptions);
  }

  const listStoreName = resolveStoreNameFromList(column?.list);
  if (!listStoreName) return [];

  const listStore = getAllStores()?.[listStoreName];
  return mapOptions(column, listStore?.getters?.items || []);
};

const resolveCellText = ({ column, row, storeName }) => {
  const fieldName = getColumnKey(column);
  const value = row?.[fieldName];
  const formattedValue = formatStoreColumnValue({
    columns: [column],
    fieldName,
    row,
    storeName,
    value,
  });

  return normalizeText(formattedValue) || '-';
};

const normalizeSortText = value =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const resolveEditValue = (column, row) => {
  const value = row?.[getColumnKey(column)];
  if (column?.list) {
    return normalizeOptionKey(
      typeof column?.formatList === 'function'
        ? column.formatList(value, row, column)
        : value,
    );
  }

  if (typeof column?.editFormat === 'function') {
    return normalizeText(column.editFormat(value, column, row, true));
  }

  return normalizeText(value);
};

const formatSaveValue = (column, value, row) => {
  if (typeof column?.saveFormat === 'function') {
    return column.saveFormat(value, column, row);
  }

  if (value && typeof value === 'object') {
    if (value.value) return Number.isNaN(Number(value.value)) ? value.value : Number(value.value);
    if (value['@id']) return value['@id'];
  }

  return Number.isNaN(Number(value)) || value === '' ? value : Number(value);
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

const DefaultDataTable = ({
  accentColor = '#2563EB',
  actions = {},
  columns = [],
  data = [],
  filters = {},
  getOptionsForColumn = null,
  hasMore = false,
  initialViewMode = 'table',
  isLoading = false,
  onEditRow = null,
  onEndReached = null,
  onFilterChange = null,
  onSaved = null,
  onSortChange = null,
  renderCard = null,
  sort = null,
  storeName = '',
}) => {
  const [draftValue, setDraftValue] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formDraft, setFormDraft] = useState({});
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);
  const [viewMode, setViewMode] = useState(initialViewMode);
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
  const tableMinimumWidth = useMemo(
    () =>
      tableColumns.reduce(
        (totalWidth, column) => totalWidth + getColumnMinWidth(column),
        ACTIONS_CELL_WIDTH,
      ),
    [tableColumns],
  );
  const tableWidth = Math.max(tableContainerWidth, tableMinimumWidth);
  const tableLayoutStyle = useMemo(
    () => (tableWidth > 0 ? { minWidth: tableWidth, width: tableWidth } : null),
    [tableWidth],
  );

  const sortedData = useMemo(() => {
    const items = Array.isArray(data) ? [...data] : [];
    const sortField = sort?.field;
    const sortDirection = sort?.direction === 'desc' ? 'desc' : 'asc';
    const sortColumn = tableColumns.find(column => getColumnKey(column) === sortField);

    if (!sortField || !sortColumn) return items;

    return items.sort((left, right) => {
      const leftValue = resolveCellText({ column: sortColumn, row: left, storeName });
      const rightValue = resolveCellText({ column: sortColumn, row: right, storeName });
      const leftNumber = Number(String(leftValue).replace(/[^0-9,.-]/g, '').replace(',', '.'));
      const rightNumber = Number(String(rightValue).replace(/[^0-9,.-]/g, '').replace(',', '.'));

      const comparison = Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
        ? leftNumber - rightNumber
        : normalizeSortText(leftValue).localeCompare(normalizeSortText(rightValue));

      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }, [data, sort?.direction, sort?.field, storeName, tableColumns]);

  const beginEdit = useCallback((row, column) => {
    if (!isEditableColumn(column)) return;
    setEditingCell(`${row?.id || row?.['@id']}:${getColumnKey(column)}`);
    setDraftValue(resolveEditValue(column, row));
  }, []);

  const clearEdit = useCallback(() => {
    setEditingCell(null);
    setDraftValue('');
  }, []);

  const saveCell = useCallback((row, column, nextValue = draftValue) => {
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
  }, [actions, clearEdit, draftValue, onSaved]);

  const requestSort = useCallback(column => {
    if (!isSortableColumn(column)) return;

    const fieldName = getColumnKey(column);
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

    const draft = {};
    editableColumns.forEach(column => {
      draft[getColumnKey(column)] = resolveEditValue(column, row);
    });

    setEditingRow(row);
    setFormDraft(draft);
  }, [editableColumns, onEditRow]);

  const closeEditModal = useCallback(() => {
    setEditingRow(null);
    setFormDraft({});
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

  const saveRowModal = useCallback(() => {
    if (!editingRow || typeof actions.save !== 'function') {
      closeEditModal();
      return Promise.resolve(null);
    }

    const payload = { id: normalizeId(editingRow?.['@id'] || editingRow?.id) };

    editableColumns.forEach(column => {
      const fieldName = getColumnKey(column);
      const currentValue = resolveEditValue(column, editingRow);
      const nextValue = formDraft[fieldName];

      if (normalizeText(currentValue) !== normalizeText(nextValue)) {
        payload[fieldName] = formatSaveValue(column, nextValue, editingRow);
      }
    });

    if (Object.keys(payload).length <= 1) {
      closeEditModal();
      return Promise.resolve(null);
    }

    setSavingCell(`row:${payload.id}`);

    return actions.save(payload)
      .then(savedItem => {
        onSaved?.(savedItem || { ...editingRow, ...formDraft }, editingRow);
        closeEditModal();
        return savedItem;
      })
      .catch(error => {
        console.error(error);
        return null;
      })
      .finally(() => setSavingCell(null));
  }, [actions, closeEditModal, editableColumns, editingRow, formDraft, onSaved]);

  const toggleColumn = useCallback(column => {
    const fieldName = getColumnKey(column);
    if (!fieldName) return;

    setVisibleColumns(prev => {
      const next = { ...prev, [fieldName]: prev[fieldName] === false };
      actions?.setVisibleColumns?.(next);
      return next;
    });
  }, [actions]);

  const handleScroll = useCallback(event => {
    if (!hasMore || isLoading || typeof onEndReached !== 'function') return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom < 120) onEndReached();
  }, [hasMore, isLoading, onEndReached]);

  const handleLayout = useCallback(event => {
    const nextWidth = Math.floor(event?.nativeEvent?.layout?.width || 0);
    if (nextWidth > 0) setTableContainerWidth(nextWidth);
  }, []);

  const renderEditableCell = (row, column) => {
    const fieldName = getColumnKey(column);
    const cellKey = `${row?.id || row?.['@id']}:${fieldName}`;
    const isEditing = editingCell === cellKey;
    const isSaving = savingCell === cellKey;
    const label = resolveCellText({ column, row, storeName });

    if (isEditing && column?.list) {
      const options = buildOptionsFromColumn(column, getOptionsForColumn);
      const selected = options.find(option => option.key === draftValue);

      return (
        <View style={[getColumnStyle(column), styles.editingCell]}>
          <View style={styles.editingRow}>
            <CompactFilterSelector
              dense
              store={storeName}
              field={fieldName}
              active={Boolean(draftValue)}
              label={selected?.label || label}
              options={options}
              selectedKey={draftValue}
              onClose={clearEdit}
              onSelect={optionKey => {
                const option = options.find(item => item.key === optionKey);
                saveCell(row, column, {
                  value: optionKey,
                  label: option?.label,
                  object: option?.raw,
                });
                return true;
              }}
            />
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={clearEdit}>
              <Icon name="x" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
          {isSaving ? <Text style={styles.savingText}>Salvando</Text> : null}
        </View>
      );
    }

    if (isEditing) {
      return (
        <View style={[getColumnStyle(column), styles.editingCell]}>
          <View style={styles.editingRow}>
            <TextInput
              style={styles.input}
              value={draftValue}
              onChangeText={setDraftValue}
              onBlur={() => saveCell(row, column)}
              onSubmitEditing={() => saveCell(row, column)}
              autoFocus
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={clearEdit}>
              <Icon name="x" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
          {isSaving ? <Text style={styles.savingText}>Salvando</Text> : null}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[getColumnStyle(column), isEditableColumn(column) ? styles.editableCell : null]}
        activeOpacity={isEditableColumn(column) ? 0.78 : 1}
        onPress={() => beginEdit(row, column)}
      >
        <Text style={[styles.cellText, label === '-' ? styles.mutedCellText : null]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderColumnFilter = column => {
    const fieldName = getColumnKey(column);

    if (column?.filter === false || column?.filters === false) {
      return <View style={getColumnStyle(column)} />;
    }

    if (column?.inputType === 'date-range') {
      const filterValue = filters?.[fieldName] || {};
      return (
        <View style={[getColumnStyle(column), styles.filterCell]}>
          <DateShortcutFilter
            dense
            store={storeName}
            field={fieldName}
            value={filterValue.shortcut || 'all'}
            customRange={filterValue.customRange || { from: '', to: '' }}
            onChange={optionKey => updateFilter(fieldName, optionKey === 'all' ? null : {
              ...(filterValue || {}),
              shortcut: optionKey,
            })}
            onCustomRangeChange={range => updateFilter(fieldName, {
              ...(filterValue || {}),
              shortcut: 'custom',
              customRange: range,
            })}
          />
        </View>
      );
    }

    if (column?.list) {
      const rawOptions = buildOptionsFromColumn(column, getOptionsForColumn);
      const options = [
        { key: '', label: global.t?.t(storeName, 'label', 'select') || 'Todos' },
        ...rawOptions,
      ];
      const selectedKey = normalizeOptionKey(filters?.[fieldName]);
      const selected = options.find(option => option.key === selectedKey);

      return (
        <View style={[getColumnStyle(column), styles.filterCell]}>
          <CompactFilterSelector
            dense
            store={storeName}
            field={fieldName}
            icon="filter"
            accentColor={accentColor}
            active={Boolean(selectedKey)}
            label={selected?.label || options[0]?.label || ''}
            options={options}
            selectedKey={selectedKey}
            onSelect={optionKey => {
              updateFilter(fieldName, optionKey);
              return true;
            }}
          />
        </View>
      );
    }

    return (
      <View style={[getColumnStyle(column), styles.filterCell]}>
        <TextInput
          style={styles.filterInput}
          value={normalizeText(filters?.[fieldName])}
          placeholder={global.t?.t(storeName, 'input', column?.label || fieldName)}
          onChangeText={value => updateFilter(fieldName, value)}
        />
      </View>
    );
  };

  const renderCardItem = row => {
    if (typeof renderCard === 'function') {
      return (
        <View key={row?.['@id'] || row?.id} style={styles.cardItem}>
          {renderCard({ item: row })}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.82} onPress={() => openEditModal(row)}>
              <Icon name="edit-2" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
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
            <Text style={styles.defaultCardValue} numberOfLines={1}>
              {resolveCellText({ column, row, storeName })}
            </Text>
          </View>
        ))}
        <TouchableOpacity style={styles.cardEditButton} activeOpacity={0.82} onPress={() => openEditModal(row)}>
          <Icon name="edit-2" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEditModal = () => (
    <Modal visible={Boolean(editingRow)} transparent animationType="fade" onRequestClose={closeEditModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{global.t?.t(storeName, 'button', 'edit') || 'Editar'}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeEditModal}>
              <Icon name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGrid}>
              {editableColumns.map(column => {
                const fieldName = getColumnKey(column);
                const label = formatStoreColumnLabel({
                  columns,
                  fieldName,
                  fallbackLabel: column?.label || fieldName,
                  storeName,
                });

                if (column?.list) {
                  const options = buildOptionsFromColumn(column, getOptionsForColumn);
                  const selectedKey = normalizeOptionKey(formDraft[fieldName]);
                  const selected = options.find(option => option.key === selectedKey);

                  return (
                    <View key={fieldName} style={styles.formField}>
                      <Text style={styles.formLabel}>{label}</Text>
                      <CompactFilterSelector
                        dense
                        store={storeName}
                        field={fieldName}
                        active={Boolean(selectedKey)}
                        label={selected?.label || '-'}
                        options={options}
                        selectedKey={selectedKey}
                        onSelect={optionKey => {
                          setFormDraft(prev => ({ ...prev, [fieldName]: optionKey }));
                          return true;
                        }}
                      />
                    </View>
                  );
                }

                return (
                  <View key={fieldName} style={styles.formField}>
                    <Text style={styles.formLabel}>{label}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={normalizeText(formDraft[fieldName])}
                      keyboardType={column?.inputType === 'number' || column?.inputType === 'float' ? 'numeric' : 'default'}
                      onChangeText={value => setFormDraft(prev => ({ ...prev, [fieldName]: value }))}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={closeEditModal}>
              <Text style={styles.secondaryButtonText}>
                {global.t?.t(storeName, 'button', 'cancel') || 'Cancelar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={saveRowModal}>
              <Text style={styles.primaryButtonText}>
                {savingCell ? 'Salvando' : global.t?.t(storeName, 'button', 'save') || 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
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
          <TouchableOpacity
            style={styles.toolbarButton}
            activeOpacity={0.82}
            onPress={() => setViewMode(prev => (prev === 'table' ? 'cards' : 'table'))}
          >
            <Icon name={viewMode === 'table' ? 'grid' : 'list'} size={14} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.82} onPress={() => setIsColumnMenuOpen(prev => !prev)}>
            <Icon name="columns" size={14} color="#64748B" />
          </TouchableOpacity>
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

      {viewMode === 'cards' ? (
        <ScrollView style={styles.cardsScroll} onScroll={handleScroll} scrollEventThrottle={160}>
          <View style={styles.cardsGrid}>
            {sortedData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
              </View>
            ) : (
              sortedData.map(renderCardItem)
            )}
          </View>
        </ScrollView>
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

                return (
                  <TouchableOpacity
                    key={fieldName}
                    style={getColumnStyle(column)}
                    activeOpacity={isSortableColumn(column) ? 0.8 : 1}
                    onPress={() => requestSort(column)}
                  >
                    <View style={styles.sortableHeader}>
                      <Text style={styles.headerText} numberOfLines={1}>{label}</Text>
                      {isSortableColumn(column) && sort?.field === fieldName ? (
                        <Icon name={sort?.direction === 'desc' ? 'chevron-down' : 'chevron-up'} size={12} color="#64748B" />
                      ) : isSortableColumn(column) ? (
                        <Icon name="chevrons-up" size={12} color="#CBD5E1" />
                      ) : null}
                      {filters?.[fieldName] ? <Icon name="filter" size={11} color={accentColor} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.cell, styles.actionsCell]}>
                <Text style={styles.headerText}>Acoes</Text>
              </View>
            </View>

            {showColumnFilters ? (
              <View style={[styles.filterRow, tableLayoutStyle]}>
                {tableColumns.map(column => (
                  <React.Fragment key={getColumnKey(column)}>
                    {renderColumnFilter(column)}
                  </React.Fragment>
                ))}
                <View style={[styles.cell, styles.actionsCell]} />
              </View>
            ) : null}

            <ScrollView style={styles.scroll} onScroll={handleScroll} scrollEventThrottle={160}>
              {sortedData.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
                </View>
              ) : (
                sortedData.map(row => (
                  <View key={row?.['@id'] || row?.id} style={[styles.row, tableLayoutStyle]}>
                    {tableColumns.map(column => (
                      <React.Fragment key={getColumnKey(column)}>
                        {renderEditableCell(row, column)}
                      </React.Fragment>
                    ))}
                    <View style={[styles.cell, styles.actionsCell]}>
                      <TouchableOpacity style={styles.iconButton} activeOpacity={0.82} onPress={() => openEditModal(row)}>
                        <Icon name="edit-2" size={14} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {renderEditModal()}
    </View>
  );
};

export default DefaultDataTable;

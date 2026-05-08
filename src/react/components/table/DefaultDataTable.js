import React, { useCallback, useMemo, useState } from 'react';
import {
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
import styles from './DefaultDataTable.styles';

const normalizeText = value => String(value ?? '').trim();

const getColumnKey = column => column?.key || column?.name || '';

const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.visible !== false &&
  column?.table !== false;

const isEditableColumn = column =>
  column?.editable === true &&
  !column?.isIdentity &&
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

const buildOptionsFromColumn = column => {
  const listStoreName = resolveStoreNameFromList(column?.list);
  if (!listStoreName) return [];

  const listStore = getAllStores()?.[listStoreName];
  const items = listStore?.getters?.items || [];

  return (Array.isArray(items) ? items : []).map(item => ({
    key: normalizeOptionKey(
      typeof column?.formatList === 'function'
        ? column.formatList(item, null, column)
        : item,
    ) || normalizeOptionKey(item),
    label: resolveOptionLabel(column, item) || '-',
    raw: item,
  }));
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

const DefaultDataTable = ({
  actions = {},
  columns = [],
  data = [],
  hasMore = false,
  isLoading = false,
  onEditRow = null,
  onEndReached = null,
  onSaved = null,
  onSortChange = null,
  sort = null,
  storeName = '',
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [savingCell, setSavingCell] = useState(null);

  const tableColumns = useMemo(
    () => columns.filter(shouldIncludeColumn),
    [columns],
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

  const editFirstColumn = useCallback(row => {
    if (typeof onEditRow === 'function') {
      onEditRow(row);
      return;
    }

    const firstEditableColumn = tableColumns.find(isEditableColumn);
    if (firstEditableColumn) {
      beginEdit(row, firstEditableColumn);
    }
  }, [beginEdit, onEditRow, tableColumns]);

  const handleScroll = useCallback(event => {
    if (!hasMore || isLoading || typeof onEndReached !== 'function') return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom < 120) {
      onEndReached();
    }
  }, [hasMore, isLoading, onEndReached]);

  const renderEditableCell = (row, column) => {
    const fieldName = getColumnKey(column);
    const cellKey = `${row?.id || row?.['@id']}:${fieldName}`;
    const isEditing = editingCell === cellKey;
    const isSaving = savingCell === cellKey;
    const label = resolveCellText({ column, row, storeName });

    if (isEditing && column?.list) {
      const options = buildOptionsFromColumn(column);
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
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={clearEdit}
            >
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
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={clearEdit}
            >
              <Icon name="x" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
          {isSaving ? <Text style={styles.savingText}>Salvando</Text> : null}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          getColumnStyle(column),
          isEditableColumn(column) ? styles.editableCell : null,
        ]}
        activeOpacity={isEditableColumn(column) ? 0.78 : 1}
        onPress={() => beginEdit(row, column)}
      >
        <Text
          style={[styles.cellText, label === '-' ? styles.mutedCellText : null]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal style={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
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
                    <Text style={styles.headerText} numberOfLines={1}>
                      {label}
                    </Text>
                    {isSortableColumn(column) && sort?.field === fieldName ? (
                      <Icon
                        name={sort?.direction === 'desc' ? 'chevron-down' : 'chevron-up'}
                        size={12}
                        color="#64748B"
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={[styles.cell, styles.actionsCell]}>
              <Text style={styles.headerText}>Acoes</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            onScroll={handleScroll}
            scrollEventThrottle={160}
          >
            {sortedData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
              </View>
            ) : (
              sortedData.map(row => (
                <View key={row?.['@id'] || row?.id} style={styles.row}>
                  {tableColumns.map(column => (
                    <React.Fragment key={getColumnKey(column)}>
                      {renderEditableCell(row, column)}
                    </React.Fragment>
                  ))}
                  <View style={[styles.cell, styles.actionsCell]}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      activeOpacity={0.82}
                      onPress={() => editFirstColumn(row)}
                    >
                      <Icon name="edit-2" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default DefaultDataTable;

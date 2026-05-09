import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CompactFilterSelector from './CompactFilterSelector';
import DateShortcutFilter from './DateShortcutFilter';
import styles from './DefaultExternalFilters.styles';

const DEFAULT_COMPACT_BREAKPOINT = 768;
const noop = () => {};

const normalizeText = value => String(value || '').trim();

const getColumnKey = column => column?.key || column?.name || '';

const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.visible !== false &&
  column?.externalFilter === true &&
  column?.filter !== false &&
  column?.filters !== false;

const normalizeFilterValue = value => {
  if (value && typeof value === 'object') {
    return normalizeFilterValue(value.value ?? value.id ?? value['@id'] ?? '');
  }

  return normalizeText(value);
};

const isFilledFilterValue = value => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') {
    return Object.values(value).some(isFilledFilterValue);
  }

  return normalizeText(value) !== '';
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

const buildColumnOptions = (column, options = []) => [
  {
    key: '',
    label: global.t?.t('invoice', 'label', 'select') || 'Todos',
  },
  ...(Array.isArray(options) ? options : []).map(option => ({
    key: normalizeFilterValue(option),
    label: resolveOptionLabel(column, option) || '-',
  })),
];

const resolveDateState = filterValue => {
  if (!filterValue || typeof filterValue !== 'object') {
    return {
      customRange: { from: '', to: '' },
      value: 'all',
    };
  }

  if (filterValue.shortcut) {
    return {
      customRange: filterValue.customRange || { from: '', to: '' },
      value: filterValue.shortcut,
    };
  }

  if (filterValue.start || filterValue.end || filterValue.after || filterValue.before) {
    return {
      customRange: {
        from: filterValue.start || filterValue.after || '',
        to: filterValue.end || filterValue.before || '',
      },
      value: 'custom',
    };
  }

  return {
    customRange: { from: '', to: '' },
    value: 'all',
  };
};

const resolveIcon = column => {
  const key = getColumnKey(column);
  if (key === 'status') return 'check-circle';
  if (key === 'category') return 'tag';
  if (column?.inputType === 'date-range') return 'calendar';
  return 'sliders';
};

const DefaultExternalFilters = ({
  accentColor = '#2563EB',
  compactBreakpoint = DEFAULT_COMPACT_BREAKPOINT,
  columns = [],
  dateOptionKeys = ['all', 'today', 'yesterday', '7d', '30d', 'custom'],
  filters = {},
  getOptionsForColumn = null,
  onActiveCountChange = null,
  onChangeFilters = null,
  storeName = '',
}) => {
  const { width } = useWindowDimensions();
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const filterColumns = useMemo(
    () => columns.filter(shouldIncludeColumn),
    [columns],
  );
  const activeCount = useMemo(
    () => filterColumns.filter(column => isFilledFilterValue(filters[getColumnKey(column)])).length,
    [filterColumns, filters],
  );

  useEffect(() => {
    onActiveCountChange?.(activeCount);
  }, [activeCount, onActiveCountChange]);

  const updateFilter = useCallback((key, value) => {
    const nextFilters = { ...(filters || {}) };
    if (!isFilledFilterValue(value)) {
      delete nextFilters[key];
    } else {
      nextFilters[key] = value;
    }
    onChangeFilters?.(nextFilters);
  }, [filters, onChangeFilters]);

  const clearFilters = useCallback(() => {
    onChangeFilters?.({});
  }, [onChangeFilters]);

  useEffect(() => {
    if (!isCompactView) setIsFiltersModalOpen(false);
  }, [isCompactView]);

  if (filterColumns.length === 0) return null;

  const renderFilterField = (column, compact = false) => {
    const key = getColumnKey(column);
    const fieldStyle = compact ? styles.modalField : styles.field;

    if (column.inputType === 'date-range') {
      const dateState = resolveDateState(filters[key]);

      return (
        <View key={key} style={fieldStyle}>
          <DateShortcutFilter
            value={dateState.value}
            onChange={optionKey => {
              if (optionKey === 'all') {
                updateFilter(key, null);
                return;
              }

              updateFilter(key, {
                ...(filters[key] || {}),
                shortcut: optionKey,
                customRange: dateState.customRange,
              });
            }}
            customRange={dateState.customRange}
            onCustomRangeChange={range => {
              updateFilter(key, {
                ...(filters[key] || {}),
                shortcut: 'custom',
                customRange: range,
              });
            }}
            dense
            store={storeName}
            field={key}
            optionKeys={dateOptionKeys}
            colors={{
              accent: accentColor,
              appBg: 'transparent',
              border: '#CBD5E1',
              borderSoft: '#E2E8F0',
              cardBg: '#FFFFFF',
              cardBgSoft: '#F8FAFC',
              danger: '#DC2626',
              isLight: true,
              panelBg: '#EFF6FF',
              pillTextDark: '#FFFFFF',
              textPrimary: '#0F172A',
              textSecondary: '#64748B',
            }}
          />
        </View>
      );
    }

    if (column.list) {
      const options = buildColumnOptions(column, getOptionsForColumn?.(column) || []);
      const selectedKey = normalizeFilterValue(filters[key]);
      const selectedLabel =
        options.find(option => option.key === selectedKey)?.label ||
        options[0]?.label ||
        '';

      return (
        <View key={key} style={fieldStyle}>
          <CompactFilterSelector
            icon={resolveIcon(column)}
            label={selectedLabel}
            accentColor={accentColor}
            active={Boolean(selectedKey)}
            dense
            store={storeName}
            field={key}
            options={options}
            selectedKey={selectedKey}
            onSelect={optionKey => {
              updateFilter(key, optionKey);
              return true;
            }}
          />
        </View>
      );
    }

    return (
      <View key={key} style={[fieldStyle, styles.inputWrap]}>
        <Text style={styles.inputLabel}>
          {global.t?.t(storeName, 'input', column.label || key)}
        </Text>
        <TextInput
          style={styles.input}
          value={normalizeText(filters[key])}
          onChangeText={value => updateFilter(key, value)}
          onSubmitEditing={() => onChangeFilters?.(filters)}
        />
      </View>
    );
  };

  const filterTitle = global.t?.t(storeName, 'label', 'filters') || 'Filtros';
  const filterFields = compact => filterColumns.map(column => renderFilterField(column, compact));

  if (isCompactView) {
    return (
      <View style={styles.mobileWrap}>
        <TouchableOpacity
          style={[
            styles.mobileButton,
            activeCount > 0 ? { borderColor: accentColor, backgroundColor: `${accentColor}14` } : null,
          ]}
          activeOpacity={0.84}
          onPress={() => setIsFiltersModalOpen(true)}
        >
          <Icon name="filter" size={15} color={activeCount > 0 ? accentColor : '#64748B'} />
          <Text
            style={[
              styles.mobileButtonText,
              activeCount > 0 ? { color: accentColor } : null,
            ]}
          >
            {filterTitle}
          </Text>
          {activeCount > 0 ? (
            <View style={[styles.mobileCountBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.mobileCountBadgeText}>{activeCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <Modal
          transparent
          visible={isFiltersModalOpen}
          animationType="fade"
          onRequestClose={() => setIsFiltersModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsFiltersModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={noop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{filterTitle}</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      activeOpacity={0.82}
                      onPress={() => setIsFiltersModalOpen(false)}
                    >
                      <Icon name="x" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filterFields(true)}
                  </ScrollView>

                  <View style={styles.modalActions}>
                    {activeCount > 0 ? (
                      <TouchableOpacity
                        style={styles.modalSecondaryButton}
                        activeOpacity={0.84}
                        onPress={clearFilters}
                      >
                        <Text style={styles.modalSecondaryButtonText}>
                          {global.t?.t(storeName, 'button', 'clear') || 'Limpar'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.modalPrimaryButton, { backgroundColor: accentColor }]}
                      activeOpacity={0.84}
                      onPress={() => setIsFiltersModalOpen(false)}
                    >
                      <Text style={styles.modalPrimaryButtonText}>
                        {global.t?.t(storeName, 'button', 'apply') || 'Aplicar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {filterFields(false)}

      {activeCount > 0 ? (
        <TouchableOpacity
          style={styles.clearButton}
          activeOpacity={0.82}
          onPress={clearFilters}
        >
          <Icon name="x" size={14} color="#64748B" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default DefaultExternalFilters;

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
import { useStore } from '@store';
import { resolveThemePalette, withOpacity } from '@controleonline/../../src/styles/branding';
import { colors } from '@controleonline/../../src/styles/colors';
import {
  buildOptionsFromColumn,
  getColumnKey,
  isDateLikeColumn,
} from '../inputs/defaultInputUtils';
import CompactFilterSelector from './CompactFilterSelector';
import DateShortcutFilter from './DateShortcutFilter';
import { resolveNextDateFilterValue } from './dateFilterSelection';
import styles from './DefaultExternalFilters.styles';

const DEFAULT_COMPACT_BREAKPOINT = 768;
const noop = () => {};

const normalizeText = value => String(value || '').trim();
const shouldIncludeColumn = column =>
  Boolean(getColumnKey(column)) &&
  column?.show !== false &&
  column?.visible !== false &&
  column?.externalFilter === true &&
  column?.filter !== false &&
  column?.filters !== false;

const normalizeFilterValue = value => {
  if (value && typeof value === 'object') {
    return normalizeFilterValue(value.value ?? value.id ?? value['@id'] ?? value.key ?? '');
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
  if (isDateLikeColumn(column)) return 'calendar';
  return 'sliders';
};

const DefaultExternalFilters = ({
  accentColor = null,
  compactBreakpoint = DEFAULT_COMPACT_BREAKPOINT,
  dateOptionKeys = ['all', 'today', 'yesterday', '7d', '30d', 'custom'],
  filters = {},
  getOptionsForColumn = null,
  onActiveCountChange = null,
  onChangeFilters = null,
  storeName = '',
}) => {
  const { width } = useWindowDimensions();
  const externalFilterStore = useStore(storeName);
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const { currentCompany } = peopleStore.getters || {};
  const { colors: themeColors } = themeStore.getters;
  const themeTokens = useMemo(
    () => ({...themeColors, ...(currentCompany?.theme?.colors || {})}),
    [currentCompany?.theme?.colors, themeColors],
  );
  const palette = useMemo(
    () => resolveThemePalette(themeTokens, colors),
    [themeTokens],
  );
  const resolvedAccentColor = accentColor || palette.primary;
  const surfaceColor = themeTokens['bg-odd-light'] || palette.background;
  const panelColor = themeTokens['bg-headers-light'] || palette.background;
  const borderColor = palette.border;
  const textColor = palette.text;
  const textSecondaryColor = palette.textSecondary;
  const buttonBackgroundColor = themeColors.buttonBackground;
  const buttonTextColor = themeColors.buttonText;
  const tableFilterBackgroundColor = themeColors.tableFilterBackground;
  const tableFilterBorderColor = themeColors.tableFilterBorder;
  const tableFilterTextColor = themeColors.tableFilterText;
  const onAccentColor = palette.secondary || palette.text;
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const resolvedColumns = useMemo(() => {
    const storeColumns = externalFilterStore?.getters?.columns;
    return Array.isArray(storeColumns) ? storeColumns : [];
  }, [externalFilterStore?.getters?.columns]);
  const filterColumns = useMemo(
    () => resolvedColumns.filter(shouldIncludeColumn),
    [resolvedColumns],
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

    if (isDateLikeColumn(column)) {
      const dateState = resolveDateState(filters[key]);

      return (
        <View key={key} style={fieldStyle}>
          <DateShortcutFilter
            value={dateState.value}
            onChange={optionKey => {
              updateFilter(
                key,
                resolveNextDateFilterValue(filters[key], optionKey),
              );
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
            labelCaption={global.t?.t(storeName, 'label', column.label || key)}
            optionKeys={dateOptionKeys}
            colors={{
              accent: resolvedAccentColor,
              appBg: 'transparent',
              border: borderColor,
              borderSoft: withOpacity(borderColor, 0.72),
              cardBg: palette.background,
              cardBgSoft: surfaceColor,
              danger: palette.error,
              isLight: true,
              panelBg: panelColor,
              pillTextDark: onAccentColor,
              textPrimary: textColor,
              textSecondary: textSecondaryColor,
            }}
          />
        </View>
      );
    }

    if (column.list) {
      const options = [
        {
          key: '',
          label:
            (column?.emptyOptionLabel
              ? global.t?.t(storeName || 'invoice', 'label', column.emptyOptionLabel) || column.emptyOptionLabel
              : null) ||
            global.t?.t(storeName || 'invoice', 'label', 'select'),
        },
        ...buildOptionsFromColumn(column, getOptionsForColumn, storeName),
      ];
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
            accentColor={resolvedAccentColor}
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
      <View key={key} style={[fieldStyle, styles.inputWrap, { borderColor, backgroundColor: surfaceColor }]}>
        <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>
          {global.t?.t(storeName, 'input', column.label || key)}
        </Text>
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={normalizeText(filters[key])}
          onChangeText={value => updateFilter(key, value)}
          onSubmitEditing={() => onChangeFilters?.(filters)}
        />
      </View>
    );
  };

  const filterTitle = global.t?.t(storeName, 'label', 'filters');
  const filterFields = compact => filterColumns.map(column => renderFilterField(column, compact));

  if (isCompactView) {
    return (
      <View style={styles.mobileWrap}>
        <TouchableOpacity
          style={[
            styles.mobileButton,
            { borderColor: borderColor, backgroundColor: surfaceColor },
            activeCount > 0 ? { borderColor: tableFilterBorderColor, backgroundColor: tableFilterBackgroundColor } : null,
          ]}
          activeOpacity={0.84}
          onPress={() => setIsFiltersModalOpen(true)}
        >
          <Icon name="filter" size={15} color={activeCount > 0 ? tableFilterTextColor : textSecondaryColor} />
          <Text
            style={[
              styles.mobileButtonText,
              { color: textColor },
              activeCount > 0 ? { color: tableFilterTextColor } : null,
            ]}
          >
            {filterTitle}
          </Text>
          {activeCount > 0 ? (
            <View style={[styles.mobileCountBadge, { backgroundColor: tableFilterBorderColor }]}>
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
            <View style={[styles.modalOverlay, { backgroundColor: withOpacity(textColor, 0.42) }]}>
              <TouchableWithoutFeedback onPress={noop}>
                <View style={[styles.modalCard, { borderColor, backgroundColor: surfaceColor }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>{filterTitle}</Text>
                    <TouchableOpacity
                      style={[styles.modalCloseButton, { borderColor: borderColor, backgroundColor: surfaceColor }]}
                      activeOpacity={0.82}
                      onPress={() => setIsFiltersModalOpen(false)}
                    >
                      <Icon name="x" size={18} color={textSecondaryColor} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filterFields(true)}
                  </ScrollView>

                  <View style={[styles.modalActions, { borderTopColor: borderColor }]}>
                    {activeCount > 0 ? (
                      <TouchableOpacity
                        style={[styles.modalSecondaryButton, { borderColor: borderColor, backgroundColor: surfaceColor }]}
                        activeOpacity={0.84}
                        onPress={clearFilters}
                      >
                        <Text style={[styles.modalSecondaryButtonText, { color: textColor }]}>
                          {global.t?.t(storeName, 'button', 'clear')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.modalPrimaryButton, { backgroundColor: buttonBackgroundColor }]}
                      activeOpacity={0.84}
                      onPress={() => setIsFiltersModalOpen(false)}
                    >
                      <Text style={[styles.modalPrimaryButtonText, { color: buttonTextColor }]}>
                        {global.t?.t(storeName, 'button', 'apply')}
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
          style={[styles.clearButton, { borderColor: borderColor, backgroundColor: surfaceColor }]}
          activeOpacity={0.82}
          onPress={clearFilters}
        >
          <Icon name="x" size={14} color={textSecondaryColor} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default DefaultExternalFilters;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import CompactFilterSelector from './CompactFilterSelector';
import createStyles from './DateShortcutFilter.styles';
import {
  buildDateFilterOptions,
  DEFAULT_DATE_FILTER_OPTION_KEYS,
  resolveDateFilterTitle,
  resolveDateRangeSummary,
  validateCustomDateRange,
} from '@controleonline/ui-common/src/react/utils/dateRangeFilter';
import {
  formatStoreColumnLabel,
  resolveStoreColumn,
  resolveStoreConfigByName,
} from '@controleonline/ui-common/src/react/utils/storeColumns';

const createDefaultColors = colors => ({
  accent: colors?.accent,
  appBg: colors?.appBg || 'transparent',
  border: colors?.border,
  borderSoft: colors?.borderSoft,
  cardBg: colors?.cardBg,
  cardBgSoft: colors?.cardBgSoft,
  danger: colors?.danger,
  isLight: typeof colors?.isLight === 'boolean' ? colors.isLight : true,
  panelBg: colors?.panelBg,
  pillTextDark: colors?.pillTextDark,
  textPrimary: colors?.textPrimary,
  textSecondary: colors?.textSecondary,
});

const COMPACT_DATE_LABELS = {
  all: 'Todos',
  today: 'Hoje',
  yesterday: 'Ontem',
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  this_month: 'Este mes',
  last_month: 'Mes ant.',
  custom: 'Periodo',
};

const normalizeText = value => String(value || '').trim();

const resolveStoreName = store => {
  if (typeof store === 'string') return normalizeText(store);
  return normalizeText(store?.storeName || store?.name || '');
};

const resolveStoreFieldLabel = ({ fallbackLabel = '', field = '', store = '' }) => {
  const storeName = resolveStoreName(store);
  const fieldName = normalizeText(field);
  if (!storeName || !fieldName) return fallbackLabel;

  const { columns } = resolveStoreConfigByName(storeName);
  const column = resolveStoreColumn(columns, fieldName);
  const labelKey = normalizeText(column?.label || fieldName);
  const translatedLabel =
    global.t?.t(storeName, 'label', labelKey) ||
    global.t?.t(storeName, 'input', labelKey);

  return (
    translatedLabel ||
    formatStoreColumnLabel({
      columns,
      fallbackLabel: fallbackLabel || labelKey,
      fieldName,
      storeName,
    }) ||
    fallbackLabel
  );
};

const DateShortcutFilter = ({
  value = '',
  onChange = null,
  customRange = null,
  onCustomRangeChange = null,
  colors = null,
  dense = false,
  field = '',
  labelCaption = '',
  optionKeys = DEFAULT_DATE_FILTER_OPTION_KEYS,
  store = '',
}) => {
  const themeColors = useMemo(() => createDefaultColors(colors), [colors]);
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [customFromInput, setCustomFromInput] = useState('');
  const [customToInput, setCustomToInput] = useState('');
  const [dateValidationMessage, setDateValidationMessage] = useState('');
  const [isCustomEditorVisible, setIsCustomEditorVisible] = useState(
    value === 'custom',
  );
  const options = buildDateFilterOptions(optionKeys);
  const periodLabel = resolveStoreFieldLabel({
    fallbackLabel: labelCaption || resolveDateFilterTitle(),
    field,
    store,
  });
  const activeRangeSummary = useMemo(
    () => resolveDateRangeSummary(value, customRange),
    [customRange, value],
  );
  const currentOptionLabel = useMemo(
    () => options.find(option => option.key === value)?.label || '',
    [options, value],
  );
  const selectedLabel = useMemo(() => (
    value === 'custom'
      ? activeRangeSummary || currentOptionLabel
      : currentOptionLabel || activeRangeSummary
  ), [activeRangeSummary, currentOptionLabel, value]);
  const compactSelectedLabel = useMemo(() => {
    if (value === 'custom') {
      return activeRangeSummary || COMPACT_DATE_LABELS.custom;
    }

    return COMPACT_DATE_LABELS[value] || currentOptionLabel || selectedLabel;
  }, [activeRangeSummary, currentOptionLabel, selectedLabel, value]);

  useEffect(() => {
    setCustomFromInput(String(customRange?.from || ''));
    setCustomToInput(String(customRange?.to || ''));
  }, [customRange?.from, customRange?.to]);

  useEffect(() => {
    if (value !== 'custom') {
      setDateValidationMessage('');
      setIsCustomEditorVisible(false);
    }
  }, [value]);

  // Custom ranges are applied explicitly so the parent only refreshes when valid.
  const applyCustomRange = useCallback(() => {
    const validationMessage = validateCustomDateRange(
      customFromInput,
      customToInput,
    );

    setDateValidationMessage(validationMessage);

    if (validationMessage) {
      return false;
    }

    onCustomRangeChange?.({
      from: String(customFromInput || '').trim(),
      to: String(customToInput || '').trim(),
    });
    return true;
  }, [customFromInput, customToInput, onCustomRangeChange]);

  const clearCustomRange = useCallback(() => {
    setCustomFromInput('');
    setCustomToInput('');
    setDateValidationMessage('');
    onCustomRangeChange?.({
      from: '',
      to: '',
    });
  }, [onCustomRangeChange]);

  const handleSelect = useCallback(optionKey => {
    if (optionKey === 'custom') {
      setIsCustomEditorVisible(true);
      setDateValidationMessage('');
      return false;
    }

    setIsCustomEditorVisible(false);
    onChange?.(optionKey);
    return true;
  }, [onChange]);

  return (
    <CompactFilterSelector
      accentColor={themeColors.accent}
      dense={dense}
      active={value !== 'all'}
      icon="calendar"
      label={dense ? compactSelectedLabel : selectedLabel}
      labelCaption={labelCaption}
      options={options}
      selectedKey={isCustomEditorVisible || value === 'custom' ? 'custom' : value}
      title=""
      store={store}
      field={field}
      onSelect={handleSelect}
    >
      {({ close }) => (isCustomEditorVisible || value === 'custom') ? (
        <View style={styles.customRangeWrap}>
          <Text style={styles.customLabel}>{periodLabel}</Text>

          <View style={styles.customInputsRow}>
            <TextInput
              value={customFromInput}
              onChangeText={setCustomFromInput}
              placeholder={global.t?.t('orders', 'placeholder', 'date_from')}
              placeholderTextColor={themeColors.textSecondary}
              style={styles.customInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              value={customToInput}
              onChangeText={setCustomToInput}
              placeholder={global.t?.t('orders', 'placeholder', 'date_to')}
              placeholderTextColor={themeColors.textSecondary}
              style={styles.customInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!!activeRangeSummary && (
            <Text style={styles.currentDateValue}>
              {activeRangeSummary}
            </Text>
          )}

          {!!dateValidationMessage && (
            <Text style={styles.validationText}>
              {dateValidationMessage}
            </Text>
          )}

          <View style={styles.customActionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.9}
              onPress={clearCustomRange}
            >
              <Text style={styles.secondaryButtonText}>
                {global.t?.t('orders', 'button', 'clear')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.9}
              onPress={() => {
                const applied = applyCustomRange();
                if (!applied) {
                  return;
                }

                close();
              }}
            >
              <Text style={styles.primaryButtonText}>
                {global.t?.t('orders', 'button', 'apply_period')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </CompactFilterSelector>
  );
};

export default DateShortcutFilter;

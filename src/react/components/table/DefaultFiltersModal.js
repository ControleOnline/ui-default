import React, {useEffect, useState} from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import DefaultColumnFilter from '../filters/DefaultColumnFilter';
import { getColumnKey, normalizeText } from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';
import {getCompactColumnLabel} from './DefaultTableCompact.helpers';
import { shouldIncludeColumn } from './DefaultTable.utils';
import {
  persistTableFiltersPreference,
  resolveDefaultTablePreferenceScope,
  sanitizeTableFiltersPreference,
} from '../../utils/tableVisibleColumnsPreferences';
import useDefaultTableTheme from './useDefaultTableTheme';
import DefaultCompactDialog from './DefaultCompactDialog';

const DefaultFiltersModal = ({ storeName, visible = false, deferred = false, onClose }) => {
  const store = useStore(storeName);
  const columns = (Array.isArray(store?.getters?.columns) ? store.getters.columns : []).filter(
    column =>
      shouldIncludeColumn(column) &&
      column?.filter !== false &&
      column?.filters !== false,
  );
  const filters = store?.getters?.filters || {};
  const configs = store?.getters?.configs || {};
  const [draft, setDraft] = useState(filters);
  useEffect(() => {if (visible) setDraft({...filters});}, [visible]);
  const activeFilters = deferred ? draft : filters;
  const tablePreferenceScope =
    configs.tablePreferenceScope ||
    resolveDefaultTablePreferenceScope({ storeName });
  const applyFilters = nextFilters => {
    const persistedFilters = sanitizeTableFiltersPreference({
      columns,
      filters: nextFilters,
    });

    persistTableFiltersPreference(tablePreferenceScope, persistedFilters);

    if (deferred && typeof configs.onFilterChange === 'function') {
      configs.onFilterChange(nextFilters);
      return;
    }
    if (typeof store?.actions?.setFilters === 'function') {
      store.actions.setFilters(nextFilters);
    } else if (store?.getters) {
      store.getters.filters = nextFilters;
    }

    configs.onFilterChange?.(nextFilters);
  };
  const updateFilter = (fieldName, value) => {
    const nextFilters = { ...(activeFilters || {}) };
    const isEmpty =
      value === null ||
      value === undefined ||
      normalizeText(value) === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) delete nextFilters[fieldName];
    else nextFilters[fieldName] = value;

    if (deferred) setDraft(nextFilters);
    else applyFilters(nextFilters);
  };
  const applyLabel = deferred ? 'Aplicar filtros' : global.t?.t(storeName, 'button', 'apply');
  const clearLabel = deferred ? 'Limpar' : global.t?.t(storeName, 'button', 'clear');
  const title = deferred ? 'Filtros' : global.t?.t(storeName, 'label', 'filters');
  const { modalColors, resolvedAccentColor, themeColors } = useDefaultTableTheme();
  if (!visible) return null;

  const {
    backgroundColor,
    borderColor,
    closeIconColor,
    headerTextColor,
    overlayColor,
    textColor,
  } = modalColors;

  if (configs.appearance === 'compact') {
    const fields = columns.filter(column => column.compactFilter !== false);
    const action = (label, onPress, primary = false) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={{minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 9, borderWidth: 1, borderColor, backgroundColor: primary ? themeColors.buttonBackground : themeColors.modalBackground}}>
      <Text style={{color: primary ? themeColors.buttonText : textColor, fontSize: 14, fontWeight: '600'}}>{label}</Text>
    </TouchableOpacity>;
    return <DefaultCompactDialog visible title="Filtros" description="Combine os filtros e aplique para atualizar os resultados." onClose={onClose}
      bodyHeight={fields.length * 86 + 40} footer={<>{action(clearLabel, () => setDraft({}))}{action(applyLabel, () => {applyFilters(draft); onClose?.();}, true)}</>}>
      {fields.map(column => <View key={getColumnKey(column)} style={{gap: 8}}>
        <Text style={{fontSize: 14, fontWeight: '600', color: textColor}}>{getCompactColumnLabel(column, formatStoreColumnLabel({columns, fieldName: getColumnKey(column), fallbackLabel: column.label || getColumnKey(column), storeName}))}</Text>
        <DefaultColumnFilter column={column} filters={activeFilters} onChange={updateFilter} storeName={storeName} />
      </View>)}
    </DefaultCompactDialog>;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modalCard, styles.filtersModalCard, { borderColor, backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: headerTextColor }]} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar filtros"
              style={[styles.modalCloseButton, { borderColor, backgroundColor }]}
              activeOpacity={0.82}
              onPress={onClose}
            >
              <Icon name="x" size={16} color={closeIconColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.filtersModalBody} contentContainerStyle={styles.filtersModalList}>
            {columns.map(column => {
              const fieldName = getColumnKey(column);
              const defaultLabel = formatStoreColumnLabel({
                columns,
                fieldName,
                fallbackLabel: column?.label || fieldName,
                storeName,
              });
              const label = configs.appearance === 'compact' ? getCompactColumnLabel(column, defaultLabel) : defaultLabel;

              return (
                <View key={fieldName} style={styles.filtersModalField}>
                  <Text style={[styles.formLabel, { color: textColor }]} numberOfLines={1}>
                    {label}
                  </Text>
                  <DefaultColumnFilter
                    column={column}
                    filters={activeFilters}
                    onChange={updateFilter}
                    storeName={storeName}
                    style={styles.filtersModalInput}
                  />
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.modalActions, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={clearLabel}
              style={[styles.secondaryButton, { borderColor }]}
              activeOpacity={0.82}
              onPress={() => deferred ? setDraft({}) : applyFilters({})}
            >
              <Text style={[styles.secondaryButtonText, { color: textColor }]}>
                {clearLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={applyLabel}
              style={[styles.primaryButton, { backgroundColor: resolvedAccentColor }]}
              activeOpacity={0.82}
              onPress={() => {if (deferred) applyFilters(draft); onClose?.();}}
            >
              <Text style={styles.primaryButtonText}>
                {applyLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DefaultFiltersModal;

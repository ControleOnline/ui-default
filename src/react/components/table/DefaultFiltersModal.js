import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import DefaultColumnFilter from '../filters/DefaultColumnFilter';
import { getColumnKey } from '../inputs/defaultInputUtils';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import styles from './DefaultTable.styles';
import { shouldIncludeColumn } from './DefaultTable.utils';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultFiltersModal = ({ storeName, visible = false, onClose }) => {
  const store = useStore(storeName);
  const {
    getOptionsForColumn,
    loadListOptionsForColumns,
    onChange,
    onClear,
  } = getDefaultTableRuntime(storeName).filters || {};
  const columns = (Array.isArray(store?.getters?.columns) ? store.getters.columns : []).filter(
    column =>
      shouldIncludeColumn(column) &&
      column?.filter !== false &&
      column?.filters !== false,
  );
  const filters = store?.getters?.filters || {};
  const applyLabel = global.t?.t(storeName, 'button', 'apply');
  const clearLabel = global.t?.t(storeName, 'button', 'clear');
  const title = global.t?.t(storeName, 'label', 'filters');
  const { modalColors, resolvedAccentColor } = useDefaultTableTheme();
  if (!visible) return null;

  const {
    backgroundColor,
    borderColor,
    closeIconColor,
    headerTextColor,
    overlayColor,
    textColor,
  } = modalColors;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modalCard, styles.filtersModalCard, { borderColor, backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: headerTextColor }]} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
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
              const label = formatStoreColumnLabel({
                columns,
                fieldName,
                fallbackLabel: column?.label || fieldName,
                storeName,
              });

              return (
                <View key={fieldName} style={styles.filtersModalField}>
                  <Text style={[styles.formLabel, { color: textColor }]} numberOfLines={1}>
                    {label}
                  </Text>
                  <DefaultColumnFilter
                    column={column}
                    filters={filters}
                    getOptionsForColumn={getOptionsForColumn}
                    onBeforeOpen={column?.list ? () => loadListOptionsForColumns?.([column]) : null}
                    onChange={onChange}
                    onSearchChange={column?.list ? value => loadListOptionsForColumns?.([column], value) : null}
                    storeName={storeName}
                    style={styles.filtersModalInput}
                  />
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.modalActions, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor }]}
              activeOpacity={0.82}
              onPress={onClear}
            >
              <Text style={[styles.secondaryButtonText, { color: textColor }]}>
                {clearLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: resolvedAccentColor }]}
              activeOpacity={0.82}
              onPress={onClose}
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

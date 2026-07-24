import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultColumnFilter from '../filters/DefaultColumnFilter';
import { getColumnKey } from '../inputs/defaultInputUtils';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultFiltersModal = ({ storeName }) => {
  const {
    applyLabel,
    clearLabel,
    columns = [],
    filters = {},
    getColumnLabel,
    getOptionsForColumn,
    loadListOptionsForColumns,
    onChange,
    onApply,
    onClear,
    onClose,
    title,
    visible = false,
  } = getDefaultTableRuntime(storeName).filtersModal || {};
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

              return (
                <View key={fieldName} style={styles.filtersModalField}>
                  <Text style={[styles.formLabel, { color: textColor }]} numberOfLines={1}>
                    {getColumnLabel ? getColumnLabel(column) : column?.label || fieldName}
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
              onPress={onApply}
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

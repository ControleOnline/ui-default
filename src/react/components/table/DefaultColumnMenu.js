import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey } from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';
import { shouldIncludeColumn } from './DefaultTable.utils';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultColumnMenu = ({ storeName, visible = false, onClose }) => {
  const store = useStore(storeName);
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const visibleColumns = store?.getters?.visibleColumns || {};
  const availableColumns = columns.filter(column => shouldIncludeColumn(column));
  const {
    checkboxBorderColor: resolvedCheckboxBorderColor,
    checkboxSelectedMarkColor: resolvedCheckboxSelectedMarkColor,
    modalColors,
  } = useDefaultTableTheme();
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
        <View style={[styles.modalCard, styles.columnMenuModalCard, { borderColor, backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: headerTextColor }]} numberOfLines={1}>
              {global.t?.t(storeName, 'label', 'columns')}
            </Text>
            <TouchableOpacity
              style={[styles.modalCloseButton, { borderColor, backgroundColor }]}
              activeOpacity={0.82}
              onPress={onClose}
            >
              <Icon name="x" size={16} color={closeIconColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.columnMenuModalBody} contentContainerStyle={styles.columnMenuModalList}>
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
                <TouchableOpacity
                  key={fieldName}
                  style={styles.columnMenuItem}
                  activeOpacity={0.82}
                  onPress={() =>
                    store?.actions?.setVisibleColumns?.({
                      ...visibleColumns,
                      [fieldName]: visibleColumns[fieldName] === false,
                    })
                  }
                >
                  <Icon
                    name={checked ? 'check-square' : 'square'}
                    size={16}
                    color={checked ? resolvedCheckboxSelectedMarkColor : resolvedCheckboxBorderColor}
                  />
                  <Text style={[styles.columnMenuText, { color: textColor }]} numberOfLines={1}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DefaultColumnMenu;

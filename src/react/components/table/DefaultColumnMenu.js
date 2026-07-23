import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey } from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';

const DefaultColumnMenu = ({
  availableColumns,
  checkboxBorderColor,
  checkboxSelectedMarkColor,
  columns,
  modalColors,
  onClose,
  onToggleColumn,
  storeName,
  visible,
  visibleColumns,
}) => {
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
              Colunas
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
                  onPress={() => onToggleColumn(column)}
                >
                  <Icon
                    name={checked ? 'check-square' : 'square'}
                    size={16}
                    color={checked ? checkboxSelectedMarkColor : checkboxBorderColor}
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

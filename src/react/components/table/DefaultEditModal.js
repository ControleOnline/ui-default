import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultForm from '../form/DefaultForm';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultEditModal = ({ storeName }) => {
  const {
    actions,
    columns = [],
    editingRow = null,
    formMode = 'edit',
    getOptionsForColumn,
    onBeforeOpen,
    onClose,
    onSearchChange,
    onSaved,
    title,
  } = getDefaultTableRuntime(storeName).editModal || {};
  const { modalColors, resolvedAccentColor } = useDefaultTableTheme();
  if (!editingRow) return null;

  const {
    backgroundColor,
    borderColor,
    closeIconColor,
    headerTextColor,
    overlayColor,
  } = modalColors;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modalCard, { borderColor, backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: headerTextColor }]}>
              {title}
            </Text>
            <TouchableOpacity
              style={[styles.modalCloseButton, { borderColor, backgroundColor }]}
              activeOpacity={0.82}
              onPress={onClose}
            >
              <Icon name="x" size={18} color={closeIconColor} />
            </TouchableOpacity>
          </View>
          <DefaultForm
            accentColor={resolvedAccentColor}
            actions={actions}
            columns={columns}
            getOptionsForColumn={getOptionsForColumn}
            mode={formMode}
            onBeforeOpen={onBeforeOpen}
            onSearchChange={onSearchChange}
            onCancel={onClose}
            onSaved={onSaved}
            row={editingRow || {}}
            storeName={storeName}
          />
        </View>
      </View>
    </Modal>
  );
};

export default DefaultEditModal;

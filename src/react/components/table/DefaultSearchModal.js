import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultSearch from '../filters/DefaultSearch';
import styles from './DefaultTable.styles';

const DefaultSearchModal = ({
  accentColor,
  filters,
  modalColors,
  onChangeFilters,
  onClose,
  onSearch,
  searchProps,
  storeName,
  title,
  value,
  visible,
}) => {
  if (!visible || !searchProps) return null;

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
        <View style={[styles.modalCard, styles.searchModalCard, { borderColor, backgroundColor }]}>
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
          <View style={styles.searchModalBody}>
            <DefaultSearch
              autoFocus
              accentColor={accentColor}
              storeName={storeName}
              {...searchProps}
              filters={filters}
              onChangeFilters={onChangeFilters}
              onSearch={onSearch}
              value={value}
              style={[styles.searchModalInput, searchProps?.style]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DefaultSearchModal;

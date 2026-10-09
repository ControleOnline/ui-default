import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultTablePaginationBar from './DefaultTablePaginationBar';
import DefaultTableBody from './DefaultTableBody';
import DefaultTableFooter from './DefaultTableFooter';
import DefaultTableToolbar from './DefaultTableToolbar';
import DefaultForm from '../form/DefaultForm';
import styles from './DefaultTable.styles';
import {DefaultTableThemeContext} from './useDefaultTableTheme';

export default function DefaultTableView({
  tablePanelBorderColor,
  themeColors,
  showToolbar,
  storeName,
  showToolbarActions,
  showToolbarControls,
  shouldRenderBottomAddButton,
  resolvedAddLabel,
  floatingAddBackgroundColor,
  resolvedOnAdd,
  floatingAddIconColor,
  shouldRenderFloatingAddButton,
  closeCreateForm,
  isCreateFormOpen,
  resolvedActions,
  columnsForTable,
  getOptionsForColumn,
  handleDefaultCreateSaved,
  requestParamsSeed
}) {
  return (
    <DefaultTableThemeContext.Provider value={themeColors}><View
      style={[
        styles.wrap,
        {
          borderWidth: tablePanelBorderColor ? 1 : 0,
          borderColor: tablePanelBorderColor,
          backgroundColor: themeColors.panelBackground,
        },
      ]}
    >
      {showToolbar !== false ? (
        <DefaultTableToolbar
          storeName={storeName}
          showToolbarActions={showToolbarActions}
          showToolbarControls={showToolbarControls}
        />
      ) : null}
      <DefaultTableBody storeName={storeName} />
      <DefaultTableFooter storeName={storeName} />
      <DefaultTablePaginationBar storeName={storeName} />
      {shouldRenderBottomAddButton ? (
        <View style={styles.bottomAddBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={resolvedAddLabel}
            activeOpacity={0.84}
            style={[
              styles.bottomAddButton,
              { backgroundColor: floatingAddBackgroundColor },
            ]}
            onPress={resolvedOnAdd}
          >
            <Icon name="plus" size={18} color={floatingAddIconColor} />
            <Text style={[styles.bottomAddText, { color: floatingAddIconColor }]}>
              {resolvedAddLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {shouldRenderFloatingAddButton ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={resolvedAddLabel}
          activeOpacity={0.84}
          style={[
            styles.floatingAddButton,
            { backgroundColor: floatingAddBackgroundColor },
          ]}
          onPress={resolvedOnAdd}
        >
          <Icon name="plus" size={24} color={floatingAddIconColor} />
        </TouchableOpacity>
      ) : null}
      <Modal
        animationType="fade"
        onRequestClose={closeCreateForm}
        transparent
        visible={isCreateFormOpen}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{resolvedAddLabel}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={global.t?.t(storeName, 'button', 'cancel') || 'Cancelar'}
                onPress={closeCreateForm}
                style={styles.modalCloseButton}
              >
                <Icon name="x" size={16} color={themeColors.textPrimary || '#0F172A'} />
              </TouchableOpacity>
            </View>
            <DefaultForm
              actions={resolvedActions}
              columns={columnsForTable}
              getOptionsForColumn={getOptionsForColumn}
              mode="create"
              onCancel={closeCreateForm}
              onSaved={handleDefaultCreateSaved}
              row={requestParamsSeed}
              storeName={storeName}
            />
          </View>
        </View>
      </Modal>
    </View></DefaultTableThemeContext.Provider>
  );
}

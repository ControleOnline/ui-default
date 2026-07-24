import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultSearch from '../filters/DefaultSearch';
import DefaultTableControls from './DefaultTableControls';
import DefaultToolbarAction from './DefaultToolbarAction';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableToolbar = ({ storeName }) => {
  const {
    onOpenSearchModal,
    resolvedTotalItemsText = '',
    searchAccessibilityLabel,
    searchProps = null,
    shouldCollapseToolbarSearch = false,
    shouldRenderCompactToolbarTotalItems = false,
    toolbarActions = [],
  } = getDefaultTableRuntime(storeName).toolbar || {};
  const { tableButtonColors, toolbarColors } = useDefaultTableTheme();
  const {
    backgroundColor: toolbarBackgroundColor,
    borderColor: toolbarBorderColor,
    countBackgroundColor: toolbarCountBackgroundColor,
    countTextColor: toolbarCountTextColor,
  } = toolbarColors;
  const {
    backgroundColor: tableButtonBackgroundColor,
    borderColor: tableButtonBorderColor,
    iconColor: tableButtonIconColor,
  } = tableButtonColors;

  const renderToolbarActions = () =>
    Array.isArray(toolbarActions) && toolbarActions.length > 0 ? (
      <View style={styles.toolbarActionGroup}>
        {toolbarActions.map(action => (
          <DefaultToolbarAction
            key={action?.key || action?.icon || action?.label}
            action={action}
          />
        ))}
      </View>
    ) : null;

  return (
    <View
      style={[
        styles.toolbar,
        shouldRenderCompactToolbarTotalItems ? styles.toolbarWithCompactTotal : null,
        { borderBottomColor: toolbarBorderColor, backgroundColor: toolbarBackgroundColor },
      ]}
    >
      {shouldRenderCompactToolbarTotalItems ? (
        <View style={styles.toolbarCompactLead}>
          <View style={[styles.toolbarCountPill, { backgroundColor: toolbarCountBackgroundColor }]}>
            <Text
              style={[styles.toolbarCountText, { color: toolbarCountTextColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {resolvedTotalItemsText}
            </Text>
          </View>
          {searchProps ? (
            <DefaultSearch compact storeName={storeName} />
          ) : null}
          {renderToolbarActions()}
        </View>
      ) : null}

      <View style={shouldRenderCompactToolbarTotalItems ? styles.toolbarCompactActions : styles.toolbarLeft}>
        {!shouldRenderCompactToolbarTotalItems && searchProps && !shouldCollapseToolbarSearch ? (
          <DefaultSearch compact storeName={storeName} />
        ) : null}
        {!shouldRenderCompactToolbarTotalItems && shouldCollapseToolbarSearch ? (
          <TouchableOpacity
            style={[
              styles.toolbarSearchButton,
              { borderColor: tableButtonBorderColor, backgroundColor: tableButtonBackgroundColor },
            ]}
            accessibilityLabel={searchAccessibilityLabel}
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={onOpenSearchModal}
          >
            <Icon name="search" size={14} color={tableButtonIconColor} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.toolbarActionGroup}>
          {!shouldRenderCompactToolbarTotalItems ? renderToolbarActions() : null}
          <DefaultTableControls storeName={storeName} />
        </View>
      </View>
    </View>
  );
};

export default DefaultTableToolbar;

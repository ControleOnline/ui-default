import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/Feather';
import DefaultSearch from '../filters/DefaultSearch';
import DefaultModalButton from './DefaultModalButton';
import DefaultSearchModal from './DefaultSearchModal';
import DefaultTableControls from './DefaultTableControls';
import DefaultToolbarAction from './DefaultToolbarAction';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import {
  COLLAPSED_SEARCH_MAX_CONTAINER_WIDTH,
  COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';
import { normalizeText } from '../inputs/defaultInputUtils';

const hasSearchFilter = store => {
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];

  return columns.some(column =>
    column?.search === true ||
    column?.searchable === true ||
    column?.filter === 'search',
  );
};

const DefaultTableToolbar = ({ storeName }) => {
  const store = useStore(storeName);
  const {
    isCompactView = false,
    showTotalItemsInCompactToolbar = false,
    showTotalItemsInFooter = true,
    tableContainerWidth = 0,
    toolbarActions = [],
    width = 0,
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
  const shouldRenderSearch = hasSearchFilter(store);
  const storeTotalItems = store?.getters?.totalItems;
  const resolvedTotalItems = storeTotalItems;
  const totalItemsNumber = Number(resolvedTotalItems);
  const shouldRenderTotalItems =
    resolvedTotalItems !== null &&
    resolvedTotalItems !== undefined &&
    Number.isFinite(totalItemsNumber);
  const shouldRenderFooterTotalItems =
    shouldRenderTotalItems &&
    showTotalItemsInFooter !== false;
  const shouldRenderCompactToolbarTotalItems =
    showTotalItemsInCompactToolbar === true &&
    isCompactView &&
    shouldRenderTotalItems &&
    !shouldRenderFooterTotalItems;
  const resolvedTotalItemsText =
    shouldRenderTotalItems
      ? `${totalItemsNumber} ${global.t?.t(storeName, 'label', 'items')}`
      : '';
  const shouldCollapseToolbarSearch =
    shouldRenderSearch &&
    ((width > 0 && width <= COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH) ||
      (tableContainerWidth > 0 &&
        tableContainerWidth <= COLLAPSED_SEARCH_MAX_CONTAINER_WIDTH));
  const searchAccessibilityLabel =
    global.t?.t(storeName, 'label', 'search');

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
          {shouldRenderSearch ? (
            <DefaultSearch compact storeName={storeName} />
          ) : null}
          {renderToolbarActions()}
        </View>
      ) : null}

      <View style={shouldRenderCompactToolbarTotalItems ? styles.toolbarCompactActions : styles.toolbarLeft}>
        {!shouldRenderCompactToolbarTotalItems && shouldRenderSearch && !shouldCollapseToolbarSearch ? (
          <DefaultSearch compact storeName={storeName} />
        ) : null}
        {!shouldRenderCompactToolbarTotalItems && shouldCollapseToolbarSearch ? (
          <DefaultModalButton
            renderButton={({ open }) => (
              <TouchableOpacity
                style={[
                  styles.toolbarSearchButton,
                  { borderColor: tableButtonBorderColor, backgroundColor: tableButtonBackgroundColor },
                ]}
                accessibilityLabel={searchAccessibilityLabel}
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={open}
              >
                <Icon name="search" size={14} color={tableButtonIconColor} />
              </TouchableOpacity>
            )}
          >
            {({ close, isOpen }) => (
              <DefaultSearchModal
                storeName={storeName}
                visible={isOpen}
                onClose={close}
              />
            )}
          </DefaultModalButton>
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

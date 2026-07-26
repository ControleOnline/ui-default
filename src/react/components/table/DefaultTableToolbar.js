import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useStore } from '@store';
import DefaultTableControls from './DefaultTableControls';
import {
  DefaultTableCollapsedSearch,
  DefaultTableCompactSearch,
  DefaultTableInlineSearch,
} from './DefaultTableSearch';
import DefaultToolbarAction from './DefaultToolbarAction';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableToolbar = ({ storeName }) => {
  const store = useStore(storeName);
  const { width } = useWindowDimensions();
  const configs = store?.getters?.configs || {};
  const compactBreakpoint = Number(configs.compactBreakpoint || 768);
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const showTotalItemsInCompactToolbar = configs.showTotalItemsInCompactToolbar === true;
  const showTotalItemsInFooter = configs.showTotalItemsInFooter !== false;
  const toolbarActions = Array.isArray(configs.toolbarActions) ? configs.toolbarActions : [];
  const { toolbarColors } = useDefaultTableTheme();
  const {
    backgroundColor: toolbarBackgroundColor,
    borderColor: toolbarBorderColor,
    countBackgroundColor: toolbarCountBackgroundColor,
    countTextColor: toolbarCountTextColor,
  } = toolbarColors;
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
        {
          borderBottomColor: toolbarBorderColor,
          borderBottomWidth: toolbarBorderColor ? 1 : 0,
          backgroundColor: toolbarBackgroundColor,
        },
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
          <DefaultTableCompactSearch storeName={storeName} />
          {renderToolbarActions()}
        </View>
      ) : null}

      <View style={shouldRenderCompactToolbarTotalItems ? styles.toolbarCompactActions : styles.toolbarLeft}>
        <DefaultTableInlineSearch storeName={storeName} />
        <DefaultTableCollapsedSearch storeName={storeName} />
        <View style={styles.toolbarActionGroup}>
          {!shouldRenderCompactToolbarTotalItems ? renderToolbarActions() : null}
          <DefaultTableControls storeName={storeName} />
        </View>
      </View>
    </View>
  );
};

export default DefaultTableToolbar;

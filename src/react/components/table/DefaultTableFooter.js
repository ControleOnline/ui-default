import React from 'react';
import { Text, View } from 'react-native';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import { formatSummaryValue } from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableFooter = ({ storeName }) => {
  const {
    columns = [],
    footerComponent = null,
    footerProps = {},
    resolvedTotalItemsText = '',
    shouldRenderCompactToolbarTotalItems = false,
    shouldRenderFooterBar = false,
    shouldRenderFooterTotalItems = false,
    summaryEntries = [],
  } = getDefaultTableRuntime(storeName).footer || {};
  const { themeColors } = useDefaultTableTheme();
  const tableFooterBackgroundColor = themeColors.tableFooterBackground;
  const tableFooterBorderColor = themeColors.tableFooterBorder;
  const tableFooterTextColor = themeColors.tableFooterText;
  const toolbarCountBackgroundColor = themeColors.badgeBackground;
  const toolbarCountTextColor = themeColors.badgeText;

  if (footerComponent) {
    return React.isValidElement(footerComponent)
      ? footerComponent
      : React.createElement(footerComponent, footerProps);
  }

  if (!shouldRenderFooterBar) {
    return null;
  }

  return (
    <View style={[styles.footerBar, { backgroundColor: tableFooterBackgroundColor, borderTopColor: tableFooterBorderColor }]}>
      {summaryEntries.length > 0 ? (
        <View style={styles.footerSummaryList}>
          {summaryEntries.map(entry => (
            <View key={entry.key} style={styles.footerSummaryItem}>
              <Text style={[styles.footerSummaryLabel, { color: tableFooterTextColor }]} numberOfLines={1}>
                {entry.label}
              </Text>
              <Text
                style={[
                  styles.footerSummaryValue,
                  { color: tableFooterTextColor },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {formatSummaryValue({
                  column: entry.column,
                  columns,
                  path: entry.path,
                  storeName,
                  value: entry.value,
                })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {shouldRenderFooterTotalItems && !shouldRenderCompactToolbarTotalItems ? (
        <View style={[styles.footerCountPill, { backgroundColor: toolbarCountBackgroundColor }]}>
          <Text
            style={[styles.footerCountText, { color: toolbarCountTextColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {resolvedTotalItemsText}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default DefaultTableFooter;

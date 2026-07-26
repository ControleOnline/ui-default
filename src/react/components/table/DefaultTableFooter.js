import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey, normalizeText } from '../inputs/defaultInputUtils';
import {
  flattenSummaryEntries,
  formatSummaryValue,
  getSummaryField,
  getSummaryOperations,
  isObject,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableFooter = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const footerComponent = configs.footerComponent || null;
  const isCompactView = false;
  const showTotalItemsInCompactToolbar = configs.showTotalItemsInCompactToolbar === true;
  const showTotalItemsInFooter = configs.showTotalItemsInFooter !== false;
  const tableColumns = columns;
  const { themeColors } = useDefaultTableTheme();
  const tableFooterBackgroundColor = themeColors.tableFooterBackground;
  const tableFooterBorderColor = themeColors.tableFooterBorder;
  const tableFooterTextColor = themeColors.tableFooterText;
  const toolbarCountBackgroundColor = themeColors.badgeBackground;
  const toolbarCountTextColor = themeColors.badgeText;
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
  const configuredSummary = configs.summary;
  const resolvedSummary = configuredSummary !== undefined
    ? configuredSummary
    : store?.getters?.summary;
  const summaryLabels = isObject(configs.summaryLabels) ? configs.summaryLabels : {};
  const shouldReadSummary = resolvedSummary !== false && isObject(resolvedSummary);
  const summaryEntries = useMemo(() => {
    if (!shouldReadSummary) return [];

    const usedPaths = new Set();
    const columnEntries = tableColumns.flatMap(column => {
      const operations = getSummaryOperations(column);
      if (!operations.length) return [];

      const fieldName = getColumnKey(column);
      const columnLabel = formatStoreColumnLabel({
        columns,
        fieldName,
        fallbackLabel: column?.label || fieldName,
        storeName,
      });

      return operations.map(operation => {
        const summaryField = getSummaryField(column, operation);
        const path = [operation, summaryField];
        const pathKey = path.join('.');
        const value = resolvedSummary?.[operation]?.[summaryField];
        if (value === undefined) return null;

        usedPaths.add(pathKey);

        return {
          key: pathKey,
            label: operations.length > 1 ? `${columnLabel} ${operation}` : columnLabel,
          path,
          value,
          column,
        };
      }).filter(Boolean);
    });

      const genericEntries = flattenSummaryEntries({
        summaryLabels,
        usedPaths,
        value: resolvedSummary,
      });

    return [...columnEntries, ...genericEntries].filter(entry =>
      entry?.value !== undefined &&
      entry?.value !== null &&
      normalizeText(entry.value) !== '',
    );
  }, [columns, resolvedSummary, shouldReadSummary, storeName, summaryLabels, tableColumns]);
  const shouldRenderFooterBar =
    (shouldRenderFooterTotalItems && !shouldRenderCompactToolbarTotalItems) ||
    summaryEntries.length > 0;

  if (footerComponent) {
    const footerProps = {
      columns,
      resolvedTotalItemsText,
      shouldRenderCompactToolbarTotalItems,
      shouldRenderFooterTotalItems,
      storeName,
      summaryEntries,
    };

    return React.isValidElement(footerComponent)
      ? footerComponent
      : React.createElement(footerComponent, footerProps);
  }

  if (!shouldRenderFooterBar) {
    return null;
  }

  return (
    <View
      style={[
        styles.footerBar,
        {
          backgroundColor: tableFooterBackgroundColor,
          borderTopColor: tableFooterBorderColor,
          borderTopWidth: tableFooterBorderColor ? 1 : 0,
        },
      ]}
    >
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

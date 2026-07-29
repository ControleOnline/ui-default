import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey, resolveCellText } from '../inputs/defaultInputUtils';
import DefaultTableEmptyState from './DefaultTableEmptyState';
import DefaultTableInput from './DefaultTableInput';
import DefaultTableRowActions, {
  hasDefaultTableRowActionsComponent,
} from './DefaultTableRowActions';
import {
  END_REACHED_THRESHOLD,
  getRowKey,
  mergeSortedDataWithLiveItems,
  shouldTriggerEndReachedFromScroll,
  shouldIncludeColumn,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableCards = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { palette } = useDefaultTableTheme();
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const visibleColumns = store?.getters?.visibleColumns || {};
  const tableColumns = columns.filter(
    column => shouldIncludeColumn(column) && visibleColumns[getColumnKey(column)] !== false,
  );
  const sortedData = mergeSortedDataWithLiveItems({
    liveItems: store?.getters?.items,
    sortedData: configs.sortedData,
  });
  const cardListProps =
    configs.cardListProps && typeof configs.cardListProps === 'object'
      ? configs.cardListProps
      : {};
  const {
    contentContainerStyle,
    key: cardListKey,
    listKey,
    ...flatListProps
  } = cardListProps;
  const isLoading = Boolean(store?.getters?.isLoadingList || store?.getters?.isLoading);
  const emptyStateLabel = isLoading
    ? global.t?.t(storeName, 'label', 'loading')
    : global.t?.t(storeName, 'label', 'empty');
  const tableBorderColor = palette.border;
  const tableMutedColor = palette.textSecondary;
  const tableSurfaceColor = palette.background;
  const tableTextColor = palette.text;
  const handleListScroll = event => {
    if (shouldTriggerEndReachedFromScroll(event)) {
      configs.onEndReached?.();
    }
  };

  const renderCardItem = (row, index = 0) => {
    const rowStyleValue = typeof configs.rowStyle === 'function'
      ? configs.rowStyle(row, index)
      : configs.rowStyle;
    const renderField = (fieldName, options = {}) => (
      <DefaultTableInput
        fieldName={fieldName}
        options={options}
        row={row}
        storeName={storeName}
        variant="card"
      />
    );
    const renderValue = (fieldName, fallback = '-') => {
      const column = columns.find(item => getColumnKey(item) === fieldName);
      if (!column) return fallback;

      return resolveCellText({ column, columns, row, storeName }) || fallback;
    };
    const RowActionsComponent = configs.rowActionsComponent;
    const hasRowPress = typeof configs.onRowPress === 'function';
    const hasCustomRowActions = hasDefaultTableRowActionsComponent(RowActionsComponent);
    const hasEditAction = typeof configs.onEditRow === 'function';
    const hasRowActions = configs.showRowActions !== false && (hasCustomRowActions || hasEditAction);
    const customRowActions = hasCustomRowActions ? (
      <DefaultTableRowActions
        component={RowActionsComponent}
        helpers={{
          openEdit: () => configs.onEditRow?.(row),
          openRow: hasRowPress ? () => configs.onRowPress(row) : null,
        }}
        openEdit={() => configs.onEditRow?.(row)}
        openRow={hasRowPress ? () => configs.onRowPress(row) : null}
        row={row}
        storeName={storeName}
      />
    ) : null;
    const editButton = hasEditAction ? (
      <Text onPress={() => configs.onEditRow?.(row)}>
        {global.t?.t(storeName, 'button', 'edit')}
      </Text>
    ) : null;

    if (typeof configs.renderCard === 'function') {
      return (
        <View
          key={row?.['@id'] || row?.id}
          style={[
            styles.cardItem,
            hasRowActions ? styles.cardItemWithActions : null,
            rowStyleValue,
          ]}
        >
          <View style={styles.cardContent}>
            {configs.renderCard({
              item: row,
              openEdit: () => configs.onEditRow?.(row),
              openRow: hasRowPress ? () => configs.onRowPress(row) : null,
              renderField,
              renderValue,
              row,
            })}
          </View>
          {hasRowActions ? (
            <View style={styles.cardActions}>
              {customRowActions}
              {editButton}
            </View>
          ) : null}
        </View>
      );
    }

    return (
      <View
        key={row?.['@id'] || row?.id}
        style={[
          styles.defaultCard,
          { backgroundColor: tableSurfaceColor, borderColor: tableBorderColor },
          rowStyleValue,
        ]}
      >
        {tableColumns.map(column => {
          const fieldName = getColumnKey(column);

          return (
            <View key={fieldName} style={styles.defaultCardLine}>
              <Text style={[styles.defaultCardLabel, { color: tableMutedColor }]}>
                {formatStoreColumnLabel({
                  columns,
                  fieldName,
                  fallbackLabel: column?.label || fieldName,
                  storeName,
                })}
              </Text>
              {renderField(fieldName, {
                  readTextStyle: [styles.defaultCardValue, { color: tableTextColor }],
                  numberOfLines: 1,
                })}
            </View>
          );
        })}
        {hasRowActions ? (
          <View style={styles.cardActionGroup}>
            {customRowActions}
            {editButton}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      key={listKey || cardListKey || `cards-${flatListProps.numColumns || 1}`}
      {...flatListProps}
      data={sortedData}
      keyExtractor={getRowKey}
      renderItem={({ item, index }) => renderCardItem(item, index)}
      style={styles.cardsScroll}
      contentContainerStyle={[styles.cardsGrid, contentContainerStyle]}
      ListEmptyComponent={(
        <DefaultTableEmptyState
          emptyStateLabel={emptyStateLabel}
          isLoading={isLoading}
          isTable={false}
          tableLayoutStyle={null}
          tableMutedColor={tableMutedColor}
        />
      )}
      ListFooterComponent={null}
      nestedScrollEnabled
      onMomentumScrollBegin={configs.onMomentumScrollBegin || undefined}
      onScroll={handleListScroll}
      onScrollBeginDrag={configs.onScrollBeginDrag || undefined}
      onEndReached={configs.onEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      scrollEventThrottle={120}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default DefaultTableCards;

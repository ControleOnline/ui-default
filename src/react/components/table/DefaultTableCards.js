import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey } from '../inputs/defaultInputUtils';
import DefaultTableEmptyState from './DefaultTableEmptyState';
import DefaultTableInput from './DefaultTableInput';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import { END_REACHED_THRESHOLD, getRowKey } from './DefaultTable.utils';
import styles from './DefaultTable.styles';

const DefaultTableCards = ({ storeName }) => {
  const {
    columns = [],
    emptyStateLabel = '',
    hasCustomRowActions = false,
    hasEditAction = false,
    hasRowActions = false,
    isLoading = false,
    onEditRow,
    onEndReached,
    onMomentumScrollBegin,
    onRequestRowPress,
    onScrollBeginDrag,
    renderCard,
    rowActionsComponent = null,
    rowStyle = null,
    sortedData = [],
    tableBorderColor,
    tableColumns = [],
    tableMutedColor,
    tableSurfaceColor,
    tableTextColor,
  } = getDefaultTableRuntime(storeName).body || {};

  const resolveRowStyle = useCallback(
    (row, index) => {
      if (typeof rowStyle === 'function') {
        return rowStyle(row, index);
      }

      return rowStyle;
    },
    [rowStyle],
  );

  const buildRowHelpers = useCallback(
    row => {
      const openEdit = () => onEditRow?.(row);
      const openRow = typeof onRequestRowPress === 'function' ? () => onRequestRowPress(row) : null;
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

        return getDefaultTableRuntime(storeName).body?.renderValue?.(row, column, fallback) ?? fallback;
      };

      return {
        openEdit,
        openRow,
        renderField,
        renderValue,
      };
    },
    [columns, onEditRow, onRequestRowPress, storeName],
  );

  const renderRowActions = row => {
    const RowActionsComponent = rowActionsComponent;
    const customRowActions = hasCustomRowActions ? (
      <RowActionsComponent
        openEdit={() => onEditRow?.(row)}
        openRow={typeof onRequestRowPress === 'function' ? () => onRequestRowPress(row) : null}
        row={row}
      />
    ) : null;
    const editButton = hasEditAction ? (
      <TouchableOpacity
        style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
        activeOpacity={0.82}
        onPress={() => onEditRow?.(row)}
      >
        <Icon name="edit-2" size={14} color={tableMutedColor} />
      </TouchableOpacity>
    ) : null;

    return {
      customRowActions,
      editButton,
    };
  };

  const renderCardItem = (row, index = 0) => {
    const helpers = buildRowHelpers(row);
    const rowStyleValue = resolveRowStyle(row, index);
    const { customRowActions, editButton } = renderRowActions(row);

    if (typeof renderCard === 'function') {
      return (
        <View key={row?.['@id'] || row?.id} style={[styles.cardItem, rowStyleValue]}>
          {renderCard({
            item: row,
            openEdit: helpers.openEdit,
            openRow: helpers.openRow,
            renderField: helpers.renderField,
            renderValue: helpers.renderValue,
            row,
          })}
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
              {helpers.renderField(fieldName, {
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
      data={sortedData}
      keyExtractor={getRowKey}
      renderItem={({ item, index }) => renderCardItem(item, index)}
      style={styles.cardsScroll}
      contentContainerStyle={styles.cardsGrid}
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
      onMomentumScrollBegin={onMomentumScrollBegin || undefined}
      onScrollBeginDrag={onScrollBeginDrag || undefined}
      onEndReached={onEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default DefaultTableCards;

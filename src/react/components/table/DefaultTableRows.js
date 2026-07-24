import React, { useCallback } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey } from '../inputs/defaultInputUtils';
import DefaultTableEmptyState from './DefaultTableEmptyState';
import DefaultTableInput from './DefaultTableInput';
import DefaultTableLoadingOverlay from './DefaultTableLoadingOverlay';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import {
  END_REACHED_THRESHOLD,
  getColumnStyle,
  getRowKey,
  getSortField,
  isSortableColumn,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';

const DefaultTableRows = ({ storeName }) => {
  const {
    actionsCellWidth = 0,
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
    onRequestSort,
    onScrollBeginDrag,
    resolvedFilters = {},
    resolvedSort = null,
    rowActionsComponent = null,
    rowStyle = null,
    sortedData = [],
    tableBorderColor,
    tableColumns = [],
    tableEvenColor,
    tableHeaderColor,
    tableLayoutStyle,
    tableMutedColor,
    tableOddColor,
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

  const renderTableItem = ({ item: row, index }) => {
    const hasRowPress = typeof onRequestRowPress === 'function';
    const RowComponent = hasRowPress ? TouchableOpacity : View;
    const rowStyleValue = resolveRowStyle(row, index);
    const rowPressProps = hasRowPress
      ? {
        activeOpacity: 0.84,
        onPress: () => onRequestRowPress(row),
      }
      : {};
    const rowBackgroundColor = index % 2 === 0 ? tableOddColor : tableEvenColor;
    const { customRowActions, editButton } = renderRowActions(row);

    return (
      <RowComponent
        key={getRowKey(row)}
        style={[
          styles.row,
          tableLayoutStyle,
          { backgroundColor: rowBackgroundColor, borderBottomColor: tableBorderColor },
          rowStyleValue,
        ]}
        {...rowPressProps}
      >
        {tableColumns.map(column => (
          <React.Fragment key={getColumnKey(column)}>
            <DefaultTableInput
              column={column}
              row={row}
              storeName={storeName}
              variant="cell"
            />
          </React.Fragment>
        ))}
        {hasRowActions ? (
          <View
            style={[
              styles.cell,
              styles.actionsCell,
              { minWidth: actionsCellWidth, width: actionsCellWidth, flexBasis: actionsCellWidth, maxWidth: actionsCellWidth },
            ]}
          >
            <View style={styles.rowActionsGroup}>
              {customRowActions}
              {editButton}
            </View>
          </View>
        ) : null}
      </RowComponent>
    );
  };

  return (
    <>
      <ScrollView horizontal style={styles.scroll}>
        <View style={[styles.content, tableLayoutStyle]}>
          <View style={[styles.headerRow, tableLayoutStyle, { backgroundColor: tableHeaderColor, borderBottomColor: tableBorderColor }]}>
            {tableColumns.map(column => {
              const fieldName = getColumnKey(column);
              const label = formatStoreColumnLabel({
                columns,
                fieldName,
                fallbackLabel: column?.label || fieldName,
                storeName,
              });
              const sortFieldName = getSortField(column);

              return (
                <TouchableOpacity
                  key={fieldName}
                  style={getColumnStyle(column)}
                  activeOpacity={isSortableColumn(column) ? 0.8 : 1}
                  onPress={() => onRequestSort?.(column)}
                >
                  <View style={styles.sortableHeader}>
                    <Text style={[styles.headerText, { color: tableTextColor }]} numberOfLines={1}>{label}</Text>
                    {isSortableColumn(column) && resolvedSort?.field === sortFieldName ? (
                      <Icon name={resolvedSort?.direction === 'desc' ? 'chevron-down' : 'chevron-up'} size={12} color={tableTextColor} />
                    ) : isSortableColumn(column) ? (
                      <Icon name="chevrons-up" size={12} color={tableBorderColor} />
                    ) : null}
                    {resolvedFilters?.[fieldName] ? <Icon name="filter" size={11} color={tableTextColor} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
            {hasRowActions ? (
              <View
                style={[
                  styles.cell,
                  styles.actionsCell,
                  {
                    minWidth: actionsCellWidth,
                    width: actionsCellWidth,
                    flexBasis: actionsCellWidth,
                    maxWidth: actionsCellWidth,
                  },
                ]}
              >
                <Text style={[styles.headerText, { color: tableTextColor }]}>
                  {global.t?.t(storeName, 'label', 'actions')}
                </Text>
              </View>
            ) : null}
          </View>

          <FlatList
            data={sortedData}
            keyExtractor={getRowKey}
            renderItem={renderTableItem}
            style={styles.tableList}
            contentContainerStyle={styles.tableListContent}
            ListEmptyComponent={(
              <DefaultTableEmptyState
                emptyStateLabel={emptyStateLabel}
                isLoading={isLoading}
                isTable
                tableLayoutStyle={tableLayoutStyle}
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
        </View>
      </ScrollView>
      <DefaultTableLoadingOverlay
        isLoading={isLoading}
        itemCount={sortedData.length}
        tableBorderColor={tableBorderColor}
        tableSurfaceColor={tableSurfaceColor}
      />
    </>
  );
};

export default DefaultTableRows;

import React from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey } from '../inputs/defaultInputUtils';
import DefaultColumnFilter from '../filters/DefaultColumnFilter';
import DefaultTableEmptyState from './DefaultTableEmptyState';
import DefaultTableInput from './DefaultTableInput';
import {
  END_REACHED_THRESHOLD,
  getColumnStyle,
  getRowKey,
  getSortField,
  isSortableColumn,
  mergeSortedDataWithLiveItems,
  shouldTriggerEndReachedFromScroll,
  shouldIncludeColumn,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableRows = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { palette, resolvedAccentColor, themeTokens } = useDefaultTableTheme();
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const visibleColumns = store?.getters?.visibleColumns || {};
  const tableColumns = columns.filter(
    column => shouldIncludeColumn(column) && visibleColumns[getColumnKey(column)] !== false,
  );
  const sortedData = mergeSortedDataWithLiveItems({
    liveItems: store?.getters?.items,
    sortedData: configs.sortedData,
  });
  const resolvedFilters = store?.getters?.filters || {};
  const isLoading = Boolean(store?.getters?.isLoadingList || store?.getters?.isLoading);
  const emptyStateLabel = isLoading
    ? global.t?.t(storeName, 'label', 'loading')
    : global.t?.t(storeName, 'label', 'empty');
  const tableBorderColor = palette.border;
  const tableEvenColor = themeTokens.listItemEvenRow || themeTokens['bg-even-light'] || palette.background;
  const tableHeaderColor = themeTokens['bg-headers-light'] || resolvedAccentColor;
  const tableMutedColor = palette.textSecondary;
  const tableOddColor = themeTokens.listItemOddRow || themeTokens['bg-odd-light'] || palette.background;
  const tableSurfaceColor = palette.background;
  const tableTextColor = palette.text;
  const rowStyle = configs.rowStyle;
  const hasRowPress = typeof configs.onRowPress === 'function';
  const hasCustomRowActions = typeof configs.rowActionsComponent === 'function';
  const hasEditAction = typeof configs.onEditRow === 'function';
  const hasRowActions = configs.showRowActions !== false && (hasCustomRowActions || hasEditAction);
  const hasColumnFilters =
    configs.showColumnFiltersButton !== false &&
    configs.tableFiltersVisible === true;
  const actionsCellWidth = hasRowActions ? 96 : 0;
  const handleListScroll = event => {
    if (shouldTriggerEndReachedFromScroll(event)) {
      configs.onEndReached?.();
    }
  };

  const renderTableItem = ({ item: row, index }) => {
    const RowComponent = hasRowPress ? TouchableOpacity : View;
    const rowStyleValue = typeof rowStyle === 'function' ? rowStyle(row, index) : rowStyle;
    const rowPressProps = hasRowPress
      ? {
        activeOpacity: 0.84,
        onPress: () => configs.onRowPress(row),
      }
      : {};
    const rowBackgroundColor = index % 2 === 0 ? tableOddColor : tableEvenColor;
    const RowActionsComponent = configs.rowActionsComponent;

    return (
      <RowComponent
        key={getRowKey(row)}
        style={[
          styles.row,
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
              {hasCustomRowActions ? (
                <RowActionsComponent
                  openEdit={() => configs.onEditRow?.(row)}
                  openRow={hasRowPress ? () => configs.onRowPress(row) : null}
                  row={row}
                />
              ) : null}
              {hasEditAction ? (
                <TouchableOpacity
                  style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]}
                  activeOpacity={0.82}
                  onPress={() => configs.onEditRow?.(row)}
                >
                  <Icon name="edit-2" size={14} color={tableMutedColor} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
      </RowComponent>
    );
  };

  return (
    <>
      <ScrollView
        horizontal
        style={styles.scroll}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <View style={styles.content}>
          <View style={[styles.headerRow, { backgroundColor: tableHeaderColor, borderBottomColor: tableBorderColor }]}>
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
                  onPress={() => configs.requestSort?.(column)}
                >
                  <View style={styles.sortableHeader}>
                    <Text style={[styles.headerText, { color: tableTextColor }]} numberOfLines={1}>{label}</Text>
                    {isSortableColumn(column) && configs.resolvedSort?.field === sortFieldName ? (
                      <Icon name={configs.resolvedSort?.direction === 'desc' ? 'chevron-down' : 'chevron-up'} size={12} color={tableTextColor} />
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
          {hasColumnFilters ? (
            <View style={[styles.filterRow, { backgroundColor: tableHeaderColor, borderBottomColor: tableBorderColor }]}>
              {tableColumns.map(column => {
                const fieldName = getColumnKey(column);

                return (
                  <View key={`${fieldName}-filter`} style={getColumnStyle(column)}>
                    {column?.filter !== false && column?.filters !== false ? (
                      <DefaultColumnFilter
                        column={column}
                        filters={resolvedFilters}
                        storeName={storeName}
                        style={styles.filterCell}
                      />
                    ) : null}
                  </View>
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
                />
              ) : null}
            </View>
          ) : null}

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
        </View>
      </ScrollView>
    </>
  );
};

export default DefaultTableRows;

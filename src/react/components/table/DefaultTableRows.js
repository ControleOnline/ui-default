import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import { getColumnKey } from '../inputs/defaultInputUtils';
import DefaultColumnFilter from '../filters/DefaultColumnFilter';
import DefaultTableEmptyState from './DefaultTableEmptyState';
import DefaultTableInput from './DefaultTableInput';
import DefaultTableRowActions, {
  hasDefaultTableRowActionsComponent,
  resolveDefaultTableRowActionsWidth,
} from './DefaultTableRowActions';
import {
  buildSelectionSummary,
  flattenGroupedTableItems,
  getGroupingColumns,
  isRowSelected,
  resolveStoreSelectedIds,
  toggleGroupSelection,
  toggleSelectedId,
} from './DefaultTable.grouping';
import {
  END_REACHED_THRESHOLD,
  getColumnStyle,
  getColumnMinWidth,
  getRowKey,
  getSortField,
  isSortableColumn,
  mergeSortedDataWithLiveItems,
  shouldTriggerEndReachedFromScroll,
  shouldIncludeColumn,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const SELECTION_COLUMN_WIDTH = 44;

const DefaultTableRows = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { palette, resolvedAccentColor, tableBorderColors, themeTokens } = useDefaultTableTheme();
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const visibleColumns = store?.getters?.visibleColumns || {};
  const tableColumns = columns.filter(
    column => shouldIncludeColumn(column) && visibleColumns[getColumnKey(column)] !== false,
  );
  const sortedData = mergeSortedDataWithLiveItems({
    liveItems: store?.getters?.items,
    sortedData: configs.sortedData,
  });
  const listData = useMemo(
    () => flattenGroupedTableItems(sortedData, columns),
    [columns, sortedData],
  );
  const selectable = configs.selectable === true;
  const selectedIds = resolveStoreSelectedIds(store, configs.selectedIds);
  const resolvedFilters = store?.getters?.filters || {};
  const isLoading = Boolean(store?.getters?.isLoadingList || store?.getters?.isLoading);
  const emptyStateLabel = isLoading
    ? global.t?.t(storeName, 'label', 'loading')
    : global.t?.t(storeName, 'label', 'empty');
  const tableBorderColor = tableBorderColors.rowBorderColor;
  const tableHeaderBorderColor = tableBorderColors.headerBorderColor || tableBorderColor;
  const tableEvenColor = themeTokens.listItemEvenRow || themeTokens['bg-even-light'] || palette.background;
  const tableHeaderColor = themeTokens['bg-headers-light'] || resolvedAccentColor;
  const tableMutedColor = palette.textSecondary;
  const tableOddColor = themeTokens.listItemOddRow || themeTokens['bg-odd-light'] || palette.background;
  const tableSurfaceColor = palette.background;
  const tableTextColor = palette.text;
  const rowStyle = configs.rowStyle;
  const hasRowPress = typeof configs.onRowPress === 'function';
  const hasCustomRowActions = hasDefaultTableRowActionsComponent(configs.rowActionsComponent);
  const hasEditAction = typeof configs.onEditRow === 'function';
  const hasRowActions = configs.showRowActions !== false && (hasCustomRowActions || hasEditAction);
  const shouldPinRowActions = configs.pinRowActions !== false;
  const hasColumnFilters =
    configs.showColumnFiltersButton !== false &&
    configs.tableFiltersVisible === true;
  const actionsCellWidth = hasRowActions ? resolveDefaultTableRowActionsWidth(configs) : 0;
  const selectionWidth = selectable ? SELECTION_COLUMN_WIDTH : 0;
  const tableMinWidth = useMemo(
    () =>
      tableColumns.reduce(
        (totalWidth, column) => totalWidth + getColumnMinWidth(column),
        actionsCellWidth + selectionWidth,
      ),
    [actionsCellWidth, selectionWidth, tableColumns],
  );
  const [horizontalMetrics, setHorizontalMetrics] = useState({
    contentWidth: 0,
    viewportWidth: 0,
    x: 0,
  });
  const updateHorizontalMetrics = patch => {
    setHorizontalMetrics(current => {
      const next = { ...current, ...patch };
      return next.contentWidth === current.contentWidth &&
        next.viewportWidth === current.viewportWidth &&
        next.x === current.x
        ? current
        : next;
    });
  };
  const stickyBodyTransforms = useMemo(() => {
    const viewportWidth = Number(horizontalMetrics.viewportWidth || 0);
    const contentWidth = Number(horizontalMetrics.contentWidth || 0);
    const x = Number(horizontalMetrics.x || 0);
    const canScrollHorizontally = viewportWidth > 0 && contentWidth > viewportWidth;
    const actionsTranslateX = canScrollHorizontally ? x + viewportWidth - contentWidth : 0;
    return {
      actions: shouldPinRowActions && actionsTranslateX !== 0 ? [{ translateX: actionsTranslateX }] : null,
    };
  }, [horizontalMetrics, shouldPinRowActions]);
  const handleHorizontalScroll = event => {
    updateHorizontalMetrics({ x: Number(event?.nativeEvent?.contentOffset?.x || 0) });
  };
  const handleHorizontalLayout = event => {
    updateHorizontalMetrics({ viewportWidth: Number(event?.nativeEvent?.layout?.width || 0) });
  };
  const handleHorizontalContentSizeChange = width => {
    updateHorizontalMetrics({ contentWidth: Number(width || 0) });
  };
  const handleListScroll = event => {
    if (shouldTriggerEndReachedFromScroll(event)) {
      configs.onEndReached?.();
    }
  };
  const tableWidth = Math.max(tableMinWidth, Number(horizontalMetrics.viewportWidth || 0));
  const emitSelection = nextIds => {
    store?.actions?.setSelected?.(nextIds);
    store?.actions?.setSummary?.(buildSelectionSummary(sortedData, nextIds, columns));
    configs.onSelectionChange?.(nextIds);
  };

  const renderSelectionCell = (selected, onPress, accessibilityLabel) => (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.cell, { minWidth: SELECTION_COLUMN_WIDTH, width: SELECTION_COLUMN_WIDTH, alignItems: 'center', justifyContent: 'center' }]}
    >
      <Icon name={selected ? 'check-square' : 'square'} size={16} color={selected ? '#0284C7' : tableMutedColor} />
    </TouchableOpacity>
  );

  const renderTableItem = ({ item, index }) => {
    if (item?.type === 'group') {
      const groupRows = item.group?.rows || [];
      const groupSelected = selectable && groupRows.length > 0 && groupRows.every(row => isRowSelected(row, selectedIds));
      return (
        <View
          testID={`default-table-group-${item.group?.id}`}
          style={[styles.row, { backgroundColor: '#ECFEFF', borderBottomColor: tableBorderColor, borderBottomWidth: tableBorderColor ? 1 : 0, minWidth: tableWidth, width: tableWidth, paddingVertical: 8 }]}
        >
          {selectable ? renderSelectionCell(groupSelected, () => emitSelection(toggleGroupSelection(selectedIds, groupRows)), `Selecionar grupo ${item.group?.label || ''}`) : null}
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            <Text style={[styles.headerText, { color: tableTextColor }]} numberOfLines={2}>{item.group?.label}</Text>
            <Text style={{ color: tableMutedColor, fontSize: 12 }}>{item.group?.count} item(s)</Text>
          </View>
        </View>
      );
    }

    const row = item?.row || item;
    const RowComponent = hasRowPress || selectable ? TouchableOpacity : View;
    const rowStyleValue = typeof rowStyle === 'function' ? rowStyle(row, index) : rowStyle;
    const selected = selectable && isRowSelected(row, selectedIds);
    const rowPressProps = hasRowPress || selectable ? {
      activeOpacity: 0.84,
      onPress: () => {
        if (selectable) emitSelection(toggleSelectedId(selectedIds, row));
        configs.onRowPress?.(row);
      },
    } : {};
    const rowBackgroundColor = selected ? '#ECFEFF' : index % 2 === 0 ? tableOddColor : tableEvenColor;
    const RowActionsComponent = configs.rowActionsComponent;

    return (
      <RowComponent
        key={item?.id || getRowKey(row)}
        style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: selected ? '#67E8F9' : tableBorderColor, borderBottomWidth: tableBorderColor ? 1 : 0, minWidth: tableWidth, width: tableWidth }, rowStyleValue]}
        {...rowPressProps}
      >
        {selectable ? renderSelectionCell(selected, () => emitSelection(toggleSelectedId(selectedIds, row)), `Selecionar linha ${getRowKey(row)}`) : null}
        {tableColumns.map(column => (
          <React.Fragment key={getColumnKey(column)}>
            <DefaultTableInput
              column={column}
              options={column?.isIdentity ? { cellStyle: [styles.pinnedIdentityCell, styles.stickyIdentityCell, { backgroundColor: rowBackgroundColor }] } : {}}
              row={row}
              storeName={storeName}
              variant="cell"
            />
          </React.Fragment>
        ))}
        {hasRowActions ? (
          <View style={[styles.cell, styles.actionsCell, shouldPinRowActions ? styles.pinnedActionsCell : null, { minWidth: actionsCellWidth, width: actionsCellWidth, flexBasis: actionsCellWidth, maxWidth: actionsCellWidth, backgroundColor: rowBackgroundColor, ...(stickyBodyTransforms.actions ? { transform: stickyBodyTransforms.actions } : {}) }]}>
            <View style={styles.rowActionsGroup}>
              {hasCustomRowActions ? (
                <DefaultTableRowActions
                  component={RowActionsComponent}
                  helpers={{ openEdit: () => configs.onEditRow?.(row), openRow: hasRowPress ? () => configs.onRowPress(row) : null }}
                  openEdit={() => configs.onEditRow?.(row)}
                  openRow={hasRowPress ? () => configs.onRowPress(row) : null}
                  row={row}
                  storeName={storeName}
                />
              ) : null}
              {hasEditAction ? (
                <TouchableOpacity style={[styles.iconButton, { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor }]} activeOpacity={0.82} onPress={() => configs.onEditRow?.(row)}>
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
      <ScrollView horizontal onContentSizeChange={handleHorizontalContentSizeChange} onLayout={handleHorizontalLayout} onScroll={handleHorizontalScroll} scrollEventThrottle={16} style={styles.scroll} contentContainerStyle={styles.horizontalScrollContent}>
        <View style={[styles.content, { minWidth: tableWidth, width: tableWidth }]}>
          <View style={[styles.headerRow, { backgroundColor: tableHeaderColor, borderBottomColor: tableHeaderBorderColor, borderBottomWidth: tableHeaderBorderColor ? 1 : 0, minWidth: tableWidth, width: tableWidth }]}>
            {selectable ? <View style={[styles.cell, { minWidth: SELECTION_COLUMN_WIDTH, width: SELECTION_COLUMN_WIDTH }]} /> : null}
            {tableColumns.map(column => {
              const fieldName = getColumnKey(column);
              const label = formatStoreColumnLabel({ columns, fieldName, fallbackLabel: column?.label || fieldName, storeName });
              const sortFieldName = getSortField(column);
              return (
                <TouchableOpacity key={fieldName} style={[getColumnStyle(column), column?.isIdentity ? [styles.stickyIdentityCell, styles.stickyHeaderCell, { backgroundColor: tableHeaderColor }] : null]} activeOpacity={isSortableColumn(column) ? 0.8 : 1} onPress={() => configs.requestSort?.(column)}>
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
              <View style={[styles.cell, styles.actionsCell, shouldPinRowActions ? styles.stickyActionsCell : null, shouldPinRowActions ? styles.stickyHeaderCell : null, { minWidth: actionsCellWidth, width: actionsCellWidth, flexBasis: actionsCellWidth, maxWidth: actionsCellWidth, backgroundColor: tableHeaderColor }]}>
                <Text style={[styles.headerText, { color: tableTextColor }]}>{global.t?.t(storeName, 'label', 'actions')}</Text>
              </View>
            ) : null}
          </View>
          <FlatList
            data={listData}
            extraData={selectedIds}
            keyExtractor={item => item?.id || getRowKey(item?.row || item)}
            renderItem={renderTableItem}
            style={styles.tableList}
            contentContainerStyle={styles.tableListContent}
            ListEmptyComponent={<DefaultTableEmptyState emptyStateLabel={emptyStateLabel} isLoading={isLoading} isTable tableMutedColor={tableMutedColor} />}
            nestedScrollEnabled
            onMomentumScrollBegin={configs.onMomentumScrollBegin || undefined}
            onScroll={handleListScroll}
            onScrollBeginDrag={configs.onScrollBeginDrag || undefined}
            onEndReached={configs.onEndReached}
            onEndReachedThreshold={END_REACHED_THRESHOLD}
            onRefresh={configs.onRefresh}
            refreshing={Boolean(configs.refreshing)}
            scrollEventThrottle={120}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </>
  );
};

export default DefaultTableRows;

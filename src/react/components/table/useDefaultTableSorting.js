import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getSortField,
  isSortableColumn,
  normalizeSortText,
  resolveDefaultSort,
  resolveSortComparable,
  sanitizeStoredSortPreference,
  stableSerialize,
} from './DefaultTable.utils';
import {
  persistTableSortPreference,
  resolveStoredTableSortPreference,
} from '../../utils/tableVisibleColumnsPreferences';

export const useDefaultTableSortState = ({
  autoMode,
  columnsForTable,
  onSortChange,
  sort,
  tablePreferenceScope,
}) => {
  const defaultSortSeed = useMemo(
    () => resolveDefaultSort(columnsForTable),
    [columnsForTable],
  );
  const storedSortSeed = useMemo(
    () =>
      sanitizeStoredSortPreference({
        columns: columnsForTable,
        fallbackSort: sort || defaultSortSeed || null,
        sort: resolveStoredTableSortPreference(tablePreferenceScope),
      }),
    [columnsForTable, defaultSortSeed, sort, tablePreferenceScope],
  );
  const storedSortSeedSignature = useMemo(
    () => stableSerialize(storedSortSeed),
    [storedSortSeed],
  );
  const [autoSort, setAutoSort] = useState(() => storedSortSeed);
  const appliedSortSeedSignatureRef = useRef(storedSortSeedSignature);
  const resolvedSort = autoMode ? autoSort : sort;

  useEffect(() => {
    if (!autoMode) return;
    if (appliedSortSeedSignatureRef.current === storedSortSeedSignature) return;

    appliedSortSeedSignatureRef.current = storedSortSeedSignature;
    setAutoSort(prev =>
      stableSerialize(prev) === storedSortSeedSignature
        ? prev
        : storedSortSeed,
    );
  }, [autoMode, storedSortSeed, storedSortSeedSignature]);

  const requestSort = useCallback(column => {
    if (!isSortableColumn(column)) return;

    const fieldName = getSortField(column);
    const nextDirection =
      resolvedSort?.field === fieldName && resolvedSort?.direction === 'asc'
        ? 'desc'
        : 'asc';
    const nextSort = {
      direction: nextDirection,
      field: fieldName,
    };

    persistTableSortPreference(tablePreferenceScope, nextSort);

    if (autoMode) {
      setAutoSort(nextSort);
      return;
    }

    onSortChange?.(nextSort);
  }, [
    autoMode,
    onSortChange,
    resolvedSort?.direction,
    resolvedSort?.field,
    tablePreferenceScope,
  ]);

  return {
    requestSort,
    resolvedSort,
  };
};

export const useDefaultTableSortedData = ({
  resolvedData,
  resolvedSort,
  storeName,
  tableColumns,
}) =>
  useMemo(() => {
    const items = Array.isArray(resolvedData) ? [...resolvedData] : [];
    const sortField = resolvedSort?.field;
    const sortDirection = resolvedSort?.direction === 'desc' ? 'desc' : 'asc';
    const sortColumn = tableColumns.find(column => getSortField(column) === sortField);

    if (!sortField || !sortColumn) return items;

    return items.sort((left, right) => {
      const leftValue = resolveSortComparable({
        column: sortColumn,
        columns: tableColumns,
        row: left,
        storeName,
      });
      const rightValue = resolveSortComparable({
        column: sortColumn,
        columns: tableColumns,
        row: right,
        storeName,
      });

      const comparison =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : normalizeSortText(leftValue).localeCompare(normalizeSortText(rightValue));

      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }, [resolvedData, resolvedSort?.direction, resolvedSort?.field, storeName, tableColumns]);

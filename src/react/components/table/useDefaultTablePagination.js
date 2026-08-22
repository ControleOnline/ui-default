import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getColumnKey,
  isDateLikeColumn,
} from '../inputs/defaultInputUtils';
import {
  normalizeCollectionItems,
  resolveDateRangeQuery,
  resolveFilterQueryValue,
  resolveHasMore,
  stableSerialize,
} from './DefaultTable.utils';

const buildQueryFromState = ({
  append,
  columnsForTable,
  filters,
  page,
  pageSizeNumber,
  requestParams,
  sort,
}) => {
  const query = {
    ...requestParams,
    itemsPerPage: pageSizeNumber,
    page,
  };

  if (sort?.field && sort?.direction) {
    query[`order[${sort.field}]`] = sort.direction;
  }

  Object.entries(filters || {}).forEach(([fieldName, value]) => {
    if (!fieldName) return;

    const column = columnsForTable.find(item => getColumnKey(item) === fieldName);

    if (isDateLikeColumn(column)) {
      const dateRange = resolveDateRangeQuery(value);
      if (dateRange.after) {
        query[`${fieldName}[after]`] = dateRange.after;
      }
      if (dateRange.before) {
        query[`${fieldName}[before]`] = dateRange.before;
      }
      return;
    }

    const normalizedValue = resolveFilterQueryValue(value);
    if (Array.isArray(normalizedValue)) {
      if (normalizedValue.length > 0) {
        query[fieldName] = normalizedValue;
      }
      return;
    }

    if (normalizedValue !== '') {
      query[fieldName] = normalizedValue;
    }
  });

  if (append) {
    query.append = true;
  }

  return query;
};

const useAutoPageLoader = ({
  autoMode,
  autoQuerySignature,
  buildRequestQuery,
  endReachedLockRef,
  pageSizeNumber,
  resolvedActions,
  showError,
  storeName,
}) => {
  const [autoHasLoaded, setAutoHasLoaded] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoLoadingMore, setAutoLoadingMore] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [autoLastPageCount, setAutoLastPageCount] = useState(0);
  const autoRequestIdRef = useRef(0);
  const autoLoadedQueryKeyRef = useRef('');
  const autoErroredQueryKeyRef = useRef('');
  const autoPageRef = useRef(0);

  const loadAutoPage = useCallback(
    (page, { append = false, refresh = false } = {}) => {
      if (!autoMode || typeof resolvedActions.getItems !== 'function') {
        return Promise.resolve([]);
      }

      const requestId = autoRequestIdRef.current + 1;
      autoRequestIdRef.current = requestId;

      if (refresh) {
        setAutoRefreshing(true);
        autoPageRef.current = 0;
      } else if (append) {
        setAutoLoadingMore(true);
      } else {
        setAutoLoading(true);
        setAutoHasLoaded(false);
        setAutoLastPageCount(0);
        autoPageRef.current = 0;
      }

      const query = buildRequestQuery(page, append);

      return Promise.resolve(resolvedActions.getItems(query))
        .then(response => {
          if (autoRequestIdRef.current !== requestId) {
            return response;
          }

          const pageItems = normalizeCollectionItems(response);
          autoPageRef.current = page;
          autoLoadedQueryKeyRef.current = autoQuerySignature;
          autoErroredQueryKeyRef.current = '';
          setAutoHasLoaded(true);
          setAutoLastPageCount(pageItems.length);
          return pageItems;
        })
        .catch(error => {
          if (autoRequestIdRef.current === requestId) {
            autoErroredQueryKeyRef.current = autoQuerySignature;
            showError?.(
              error?.message || global.t?.t(storeName, 'error', 'load'),
            );
          }

          return [];
        })
        .finally(() => {
          if (autoRequestIdRef.current === requestId) {
            setAutoLoading(false);
            setAutoLoadingMore(false);
            setAutoRefreshing(false);
            endReachedLockRef.current = false;
          }
        });
    },
    [
      autoMode,
      autoQuerySignature,
      buildRequestQuery,
      endReachedLockRef,
      resolvedActions,
      showError,
      storeName,
    ],
  );

  return {
    autoErroredQueryKeyRef,
    autoHasLoaded,
    autoLastPageCount,
    autoLoadedQueryKeyRef,
    autoLoading,
    autoLoadingMore,
    autoRefreshing,
    autoPageRef,
    loadAutoPage,
    pageSizeNumber,
  };
};

const useAutoPageEffect = ({
  autoErroredQueryKeyRef,
  autoLoadedQueryKeyRef,
  autoLoading,
  autoLoadingMore,
  autoMode,
  autoQuerySignature,
  endReachedLockRef,
  isFocused,
  loadAutoPage,
  resolvedActions,
}) => {
  useEffect(() => {
    if (!autoMode || !isFocused) return;
    if (typeof resolvedActions.getItems !== 'function') return;
    if (
      autoLoading ||
      autoLoadingMore ||
      autoLoadedQueryKeyRef.current === autoQuerySignature ||
      autoErroredQueryKeyRef.current === autoQuerySignature
    ) {
      return;
    }

    endReachedLockRef.current = false;
    loadAutoPage(1, { append: false });
  }, [
    autoErroredQueryKeyRef,
    autoLoadedQueryKeyRef,
    autoLoading,
    autoLoadingMore,
    autoMode,
    autoQuerySignature,
    endReachedLockRef,
    isFocused,
    loadAutoPage,
    resolvedActions,
  ]);
};

export const useDefaultTablePagination = ({
  autoMode,
  columnsForTable,
  data,
  filters,
  hasMore,
  isFocused,
  isLoading,
  onRefresh,
  onEndReached,
  pageSize,
  requestParams,
  resolvedActions,
  resolvedSort,
  resolvedTotalItems,
  showError,
  store,
  storeName,
}) => {
  const endReachedLockRef = useRef(false);
  const previousPaginationStateRef = useRef({
    dataLength: Array.isArray(data) ? data.length : 0,
    filtersKey: JSON.stringify(filters || {}),
    sortDirection: resolvedSort?.direction,
    sortField: resolvedSort?.field,
  });
  const pageSizeNumber = Number(requestParams.itemsPerPage || pageSize || 50) || 50;
  const buildRequestQuery = useCallback(
    (page, append = false) =>
      buildQueryFromState({
        append,
        columnsForTable,
        filters,
        page,
        pageSizeNumber,
        requestParams,
        sort: resolvedSort,
      }),
    [columnsForTable, filters, pageSizeNumber, requestParams, resolvedSort],
  );
  // Signature must reflect the *merged* request query. Filters that only
  // mirror keys already present in requestParams (e.g. People link.linkType)
  // must not trigger a second identical getItems call on mount.
  const autoQuerySignature = useMemo(
    () =>
      stableSerialize(
        buildQueryFromState({
          append: false,
          columnsForTable,
          filters,
          page: 1,
          pageSizeNumber,
          requestParams,
          sort: resolvedSort,
        }),
      ),
    [columnsForTable, filters, pageSizeNumber, requestParams, resolvedSort],
  );
  const {
    autoErroredQueryKeyRef,
    autoHasLoaded,
    autoLastPageCount,
    autoLoadedQueryKeyRef,
    autoLoading,
    autoLoadingMore,
    autoRefreshing,
    autoPageRef,
    loadAutoPage,
  } = useAutoPageLoader({
    autoMode,
    autoQuerySignature,
    buildRequestQuery,
    endReachedLockRef,
    pageSizeNumber,
    resolvedActions,
    showError,
    storeName,
  });

  useAutoPageEffect({
    autoErroredQueryKeyRef,
    autoLoadedQueryKeyRef,
    autoLoading,
    autoLoadingMore,
    autoMode,
    autoQuerySignature,
    endReachedLockRef,
    isFocused,
    loadAutoPage,
    resolvedActions,
  });

  const resolvedIsLoading = autoMode
    ? (autoLoading || autoLoadingMore)
    : Boolean(isLoading);
  const resolvedIsRefreshing = autoMode
    ? autoRefreshing
    : false;
  const resolvedData = autoMode
    ? (autoHasLoaded && Array.isArray(store?.getters?.items) ? store.getters.items : [])
    : (Array.isArray(data) ? data : []);
  const resolvedHasMore = useMemo(
    () => {
      if (autoMode) {
        if (Number.isFinite(Number(resolvedTotalItems)) && Number(resolvedTotalItems) > 0) {
          return resolvedData.length < Number(resolvedTotalItems);
        }

        return autoLastPageCount >= pageSizeNumber && resolvedData.length > 0;
      }

      return resolveHasMore({
        hasMore,
        dataLength: resolvedData.length,
        totalItems: resolvedTotalItems,
      });
    },
    [autoLastPageCount, autoMode, hasMore, pageSizeNumber, resolvedData.length, resolvedTotalItems],
  );

  useEffect(() => {
    const nextPaginationState = {
      dataLength: resolvedData.length,
      filtersKey: stableSerialize(filters || {}),
      sortDirection: resolvedSort?.direction,
      sortField: resolvedSort?.field,
    };

    const previousPaginationState = previousPaginationStateRef.current;
    const didPaginationStateChange =
      previousPaginationState.dataLength !== nextPaginationState.dataLength ||
      previousPaginationState.filtersKey !== nextPaginationState.filtersKey ||
      previousPaginationState.sortDirection !== nextPaginationState.sortDirection ||
      previousPaginationState.sortField !== nextPaginationState.sortField;

    if (didPaginationStateChange) {
      endReachedLockRef.current = false;
      previousPaginationStateRef.current = nextPaginationState;
    }
  }, [filters, resolvedData.length, resolvedSort?.direction, resolvedSort?.field]);

  const handleEndReached = useCallback(() => {
    if (
      !resolvedHasMore ||
      resolvedIsLoading ||
      endReachedLockRef.current === true
    ) {
      return;
    }

    endReachedLockRef.current = true;

    if (autoMode) {
      const nextPage = autoPageRef.current + 1;
      loadAutoPage(nextPage, { append: true });
      return;
    }

    if (typeof onEndReached === 'function') {
      onEndReached();
    }
  }, [
    autoMode,
    autoPageRef,
    loadAutoPage,
    onEndReached,
    resolvedHasMore,
    resolvedIsLoading,
  ]);

  const handleRefresh = useCallback(() => {
    endReachedLockRef.current = false;

    if (autoMode) {
      return loadAutoPage(1, { append: false, refresh: true });
    }

    if (typeof onRefresh === 'function') {
      return Promise.resolve(onRefresh());
    }

    return Promise.resolve([]);
  }, [autoMode, loadAutoPage, onRefresh]);

  return {
    buildRequestQuery,
    currentPage: autoPageRef.current,
    handleEndReached,
    handleRefresh,
    pageSizeNumber,
    resolvedData,
    resolvedHasMore,
    resolvedIsRefreshing,
    resolvedIsLoading,
  };
};

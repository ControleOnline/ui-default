import { useEffect, useRef } from 'react';
import {
  resolveStoredTableFiltersPreference,
  resolveStoredVisibleColumnsPreference,
  sanitizeTableFiltersPreference,
  sanitizeVisibleColumnsPreference,
} from '../../utils/tableVisibleColumnsPreferences';

export const publishStoreValue = (store, actionName, value, getterName) => {
  if (typeof store?.actions?.[actionName] === 'function') {
    store.actions[actionName](value);
    return;
  }

  if (store?.getters) {
    store.getters[getterName] = value;
  }
};

export const assignGetterValue = (store, getterName, value) => {
  if (store?.getters) {
    store.getters[getterName] = value;
  }
};

/** Stable JSON compare for filter objects (anti React #185 on period toggle). */
export const areTableFiltersEqual = (a, b) => {
  try {
    return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
  } catch {
    return a === b;
  }
};

/**
 * Keeps controlled DefaultTable props (data/columns/configs/preferences) in sync
 * with the zustand store without depending on store object identity.
 * Zustand replaces the store slice on every commit; using that identity in effect
 * deps caused React error #185 (Maximum update depth exceeded) on Devices.
 *
 * Stored filters are hydrated once per preference scope / columns signature.
 * Re-applying on every storeFilters change caused Maximum update depth when
 * toggling date period (today → all → today) on OrderHistoryPage (app-community#448).
 */
export function useDefaultTableStoreSync({
  columns,
  columnsForTable,
  data,
  defaultTableConfigs,
  defaultTableConfigsSignature,
  store,
  storeColumnsLength,
  storeFilters,
  storeName,
  tablePreferenceScope,
}) {
  const storeRef = useRef(store);
  storeRef.current = store;
  const lastPublishedItemsRef = useRef(undefined);
  const configsSignatureRef = useRef('');
  const lastHydratedFiltersKeyRef = useRef('');
  const storeFiltersRef = useRef(storeFilters);
  storeFiltersRef.current = storeFilters;

  useEffect(() => {
    if (storeColumnsLength > 0 || !Array.isArray(columns) || columns.length === 0) {
      return;
    }

    publishStoreValue(storeRef.current, 'setColumns', columns, 'columns');
  }, [columns, storeColumnsLength, storeName]);

  useEffect(() => {
    if (data === undefined || !Array.isArray(data)) {
      lastPublishedItemsRef.current = undefined;
      return;
    }

    if (lastPublishedItemsRef.current === data) {
      return;
    }

    lastPublishedItemsRef.current = data;
    publishStoreValue(storeRef.current, 'setItems', data, 'items');
  }, [data, storeName]);

  useEffect(() => {
    if (!columnsForTable.length) {
      return;
    }

    const storedVisibleColumns = resolveStoredVisibleColumnsPreference(tablePreferenceScope);
    if (!storedVisibleColumns) {
      return;
    }

    const nextVisibleColumns = sanitizeVisibleColumnsPreference({
      columns: columnsForTable,
      visibleColumns: storedVisibleColumns,
    });

    if (!nextVisibleColumns.length) {
      return;
    }

    publishStoreValue(
      storeRef.current,
      'setVisibleColumns',
      nextVisibleColumns,
      'visibleColumns',
    );
  }, [columnsForTable, storeName, tablePreferenceScope]);

  useEffect(() => {
    if (!columnsForTable.length) {
      return;
    }

    const scopeKey = [
      tablePreferenceScope?.companyKey || '',
      tablePreferenceScope?.storeKey || '',
      tablePreferenceScope?.routeKey || '',
      columnsForTable.map(c => c?.key || c?.name || '').join('|'),
    ].join('::');

    const storedFilters = resolveStoredTableFiltersPreference(tablePreferenceScope);
    if (!storedFilters) {
      lastHydratedFiltersKeyRef.current = scopeKey;
      return;
    }

    const nextFilters = sanitizeTableFiltersPreference({
      columns: columnsForTable,
      filters: storedFilters,
    });

    if (Object.keys(nextFilters).length === 0) {
      lastHydratedFiltersKeyRef.current = scopeKey;
      return;
    }

    // Hydrate once per scope/columns; never chase storeFilters (loop on period toggle).
    if (lastHydratedFiltersKeyRef.current === scopeKey) {
      return;
    }

    if (areTableFiltersEqual(storeFiltersRef.current, nextFilters)) {
      lastHydratedFiltersKeyRef.current = scopeKey;
      return;
    }

    lastHydratedFiltersKeyRef.current = scopeKey;
    publishStoreValue(storeRef.current, 'setFilters', nextFilters, 'filters');
  }, [columnsForTable, storeName, tablePreferenceScope]);

  useEffect(() => {
    if (configsSignatureRef.current === defaultTableConfigsSignature) {
      return;
    }

    configsSignatureRef.current = defaultTableConfigsSignature;
    publishStoreValue(storeRef.current, 'setConfigs', defaultTableConfigs, 'configs');
  }, [defaultTableConfigs, defaultTableConfigsSignature, storeName]);
}

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

/**
 * Keeps controlled DefaultTable props (data/columns/configs/preferences) in sync
 * with the zustand store without depending on store object identity.
 * Zustand replaces the store slice on every commit; using that identity in effect
 * deps caused React error #185 (Maximum update depth exceeded) on Devices.
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

    const storedFilters = resolveStoredTableFiltersPreference(tablePreferenceScope);
    if (!storedFilters) {
      return;
    }

    const nextFilters = sanitizeTableFiltersPreference({
      columns: columnsForTable,
      filters: storedFilters,
    });

    if (Object.keys(nextFilters).length === 0) {
      return;
    }

    publishStoreValue(storeRef.current, 'setFilters', nextFilters, 'filters');
  }, [columnsForTable, storeFilters, storeName, tablePreferenceScope]);

  useEffect(() => {
    if (configsSignatureRef.current === defaultTableConfigsSignature) {
      return;
    }

    configsSignatureRef.current = defaultTableConfigsSignature;
    publishStoreValue(storeRef.current, 'setConfigs', defaultTableConfigs, 'configs');
  }, [defaultTableConfigs, defaultTableConfigsSignature, storeName]);
}

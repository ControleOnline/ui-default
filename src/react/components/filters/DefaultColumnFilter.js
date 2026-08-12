import React, { useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { getAllStores, useStore } from '@store';
import {
  buildOptionsFromColumn,
  getColumnKey,
  isDateLikeColumn,
  mapOptions,
  normalizeOptionKey,
  normalizeText,
  resolveStoreNameFromList,
} from '../inputs/defaultInputUtils';
import CompactFilterSelector from './CompactFilterSelector';
import DateShortcutFilter from './DateShortcutFilter';
import { resolveNextDateFilterValue } from './dateFilterSelection';
import useDefaultTableTheme from '@controleonline/ui-default/src/react/components/table/useDefaultTableTheme';
import {
  normalizeCollectionItems,
  resolveColumnListLoadParams,
  resolveListActionName,
  stableSerialize,
} from '../table/DefaultTable.utils';
import {
  persistTableFiltersPreference,
  resolveDefaultTablePreferenceScope,
  sanitizeTableFiltersPreference,
} from '../../utils/tableVisibleColumnsPreferences';
import styles from './DefaultColumnFilter.styles';

const DefaultColumnFilter = ({
  accentColor = null,
  column,
  filters = {},
  onBeforeOpen = null,
  onSearchChange = null,
  getOptionsForColumn = null,
  onChange = null,
  storeName = '',
  style = null,
}) => {
  const store = useStore(storeName);
  const peopleStore = useStore('people');
  const configs = store?.getters?.configs || {};
  const { resolvedAccentColor } = useDefaultTableTheme(accentColor);
  const [loadedItems, setLoadedItems] = useState([]);
  const [loadedKey, setLoadedKey] = useState('');
  const fieldName = getColumnKey(column);
  const currentCompanyId = peopleStore?.getters?.currentCompany?.id;

  useEffect(() => {
    setLoadedItems([]);
    setLoadedKey('');
  }, [currentCompanyId]);

  const requestChange = useCallback(
    (nextFieldName, value) => {
      if (typeof onChange === 'function') {
        onChange(nextFieldName, value);
        return;
      }

      const currentFilters = store?.getters?.filters || {};
      const nextFilters = { ...(currentFilters || {}) };
      const isEmpty =
        value === null ||
        value === undefined ||
        normalizeText(value) === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) delete nextFilters[nextFieldName];
      else nextFilters[nextFieldName] = value;

      const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
      const tablePreferenceScope =
        configs.tablePreferenceScope ||
        resolveDefaultTablePreferenceScope({
          companyId: currentCompanyId,
          storeName,
        });
      const persistedFilters = sanitizeTableFiltersPreference({
        columns,
        filters: nextFilters,
      });

      persistTableFiltersPreference(tablePreferenceScope, persistedFilters);

      if (typeof store?.actions?.setFilters === 'function') {
        store.actions.setFilters(nextFilters);
      } else if (store?.getters) {
        store.getters.filters = nextFilters;
      }

      configs.onFilterChange?.(nextFilters);
    },
    [configs, currentCompanyId, onChange, store, storeName],
  );
  const resolveOptions = useCallback(
    targetColumn => {
      const configOptions = configs.getOptionsForColumn?.(targetColumn);
      const propOptions = getOptionsForColumn?.(targetColumn);

      if (Array.isArray(configOptions)) return configOptions;
      if (Array.isArray(propOptions)) return propOptions;
      if (targetColumn === column && loadedItems.length > 0) return loadedItems;

      return undefined;
    },
    [column, configs, getOptionsForColumn, loadedItems],
  );
  const loadListOptions = useCallback(
    (searchValue = '') => {
      const listStoreName = resolveStoreNameFromList(column?.list);
      const actionName = resolveListActionName(column?.list);
      const listStore = getAllStores?.()?.[listStoreName];
      const listAction = listStore?.actions?.[actionName];

      if (!listStoreName || typeof listAction !== 'function') {
        return Promise.resolve([]);
      }

      const listLoadParams = resolveColumnListLoadParams({
        column,
        currentCompanyId,
        requestParams: configs.requestParams || {},
        searchValue,
      });
      const nextLoadedKey = stableSerialize({
        actionName,
        listLoadParams,
        listStoreName,
      });

      if (!normalizeText(searchValue) && loadedKey === nextLoadedKey && loadedItems.length > 0) {
        return Promise.resolve(loadedItems);
      }

      return Promise.resolve(
        listAction({
          ...listLoadParams,
          __storeMeta: {
            dedupeKey: `default-column-filter-list:${fieldName}:${nextLoadedKey}`,
            skipSystemError: true,
          },
        }),
      )
        .then(response => {
          const items = normalizeCollectionItems(response);
          setLoadedItems(items);
          setLoadedKey(nextLoadedKey);
          return items;
        })
        .catch(() => []);
    },
    [
      column,
      configs.requestParams,
      currentCompanyId,
      fieldName,
      loadedItems,
      loadedKey,
    ],
  );

  if (column?.filter === false || column?.filters === false) {
    return <View style={style} />;
  }

  if (isDateLikeColumn(column)) {
    const filterValue = filters?.[fieldName] || {};
    return (
      <View style={[style, styles.filterCell]}>
        <DateShortcutFilter
          dense
          store={storeName}
          field={fieldName}
          labelCaption={global.t?.t(storeName, 'label', column?.label || fieldName)}
          value={filterValue.shortcut || 'all'}
          customRange={filterValue.customRange || { from: '', to: '' }}
          onChange={optionKey =>
            requestChange(
              fieldName,
              resolveNextDateFilterValue(filterValue, optionKey),
            )
          }
          onCustomRangeChange={range => requestChange(fieldName, {
            ...(filterValue || {}),
            shortcut: 'custom',
            customRange: range,
          })}
        />
      </View>
    );
  }

  if (column?.list) {
    /*
     * @agents List options for filters must load only when the modal opens
     * (onBeforeOpen). Falling back to the shared store items would show
     * another company's payment types / wallets / categories.
     */
    const explicitOptions = resolveOptions(column);
    const rawOptions = Array.isArray(explicitOptions)
      ? mapOptions(column, explicitOptions, storeName)
      : mapOptions(column, loadedItems, storeName);
    const options = [
      { key: '', label: global.t?.t(storeName, 'label', 'select') },
      ...rawOptions,
    ];
    const selectedKey = normalizeOptionKey(filters?.[fieldName]);
    const selected = options.find(option => option.key === selectedKey);

    return (
      <View style={[style, styles.filterCell]}>
        <CompactFilterSelector
          dense
          store={storeName}
          field={fieldName}
          icon="filter"
          onBeforeOpen={onBeforeOpen || (() => loadListOptions())}
          onSearchChange={onSearchChange || (value => loadListOptions(value))}
          accentColor={resolvedAccentColor}
          active={Boolean(selectedKey)}
          label={selected?.label || options[0]?.label || ''}
          options={options}
          searchable
          selectedKey={selectedKey}
          onSelect={optionKey => {
            requestChange(fieldName, optionKey);
            return true;
          }}
        />
      </View>
    );
  }

  return (
    <View style={[style, styles.filterCell]}>
      <TextInput
        style={styles.filterInput}
        value={normalizeText(filters?.[fieldName])}
        placeholder={global.t?.t(storeName, 'input', column?.label || fieldName)}
        onChangeText={value => requestChange(fieldName, value)}
      />
    </View>
  );
};

export default DefaultColumnFilter;

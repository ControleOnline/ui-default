import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getAllStores, useStore } from '@store';
import {
  buildOptionsFromColumn,
  getColumnKey,
  isEditableColumn,
  mapOptions,
  normalizeOptionKey,
  normalizeText,
  resolveCellText,
  resolveEditValue,
  resolveStoreNameFromList,
} from './defaultInputUtils';
import inputStyles from './DefaultInput.styles';
import styles from './DefaultSelect.styles';

const COMPANY_SCOPED_LIST_STORES = new Set([
  'categories',
  'paymentType',
  'wallet',
]);

const normalizeCollectionItems = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];
  return [];
};

const stableSerialize = value => {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(item => stableSerialize(item)).join(',')}]`;
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

const resolveListActionName = list =>
  normalizeText(list).split('/')[1] || 'getItems';

const resolveCompanyScopedParams = ({ currentCompanyId, listStoreName }) => {
  if (!currentCompanyId || !COMPANY_SCOPED_LIST_STORES.has(listStoreName)) {
    return {};
  }

  return listStoreName === 'categories'
    ? { company: currentCompanyId }
    : { people: currentCompanyId };
};

const resolveColumnListLoadParams = ({
  column,
  currentCompanyId,
  requestParams = {},
  searchValue = '',
}) => {
  const listStoreName = resolveStoreNameFromList(column?.list);
  const resolvedCustomParams = typeof column?.listRequestParams === 'function'
    ? column.listRequestParams({ currentCompanyId, requestParams })
    : column?.listRequestParams;
  const customParams =
    resolvedCustomParams &&
    typeof resolvedCustomParams === 'object' &&
    !Array.isArray(resolvedCustomParams)
      ? resolvedCustomParams
      : {};

  return {
    ...resolveCompanyScopedParams({ currentCompanyId, listStoreName }),
    ...customParams,
    ...(normalizeText(searchValue)
      ? { [column?.listSearchParam || column?.searchParam || 'search']: normalizeText(searchValue) }
      : {}),
  };
};

const DefaultSelect = ({
  accentColor = '#2563EB',
  autoSave = true,
  column,
  columns = [],
  containerStyle = null,
  displayValue,
  editing = false,
  getOptionsForColumn = null,
  label = '',
  numberOfLines = 1,
  onBeforeOpen = null,
  onCancelEditing = null,
  onChangeValue = null,
  onSave = null,
  onSearchChange = null,
  onStartEditing = null,
  readTextStyle = null,
  row = {},
  saving = false,
  showLabel = false,
  storeName = '',
  value,
  variant = 'cell',
}) => {
  const peopleStore = useStore('people');
  const ownerStore = useStore(storeName);
  const loadedListKeysRef = useRef(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [loadedItems, setLoadedItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const currentCompanyId = peopleStore?.getters?.currentCompany?.id;
  const requestParams = ownerStore?.getters?.configs?.requestParams || {};

  const fieldName = getColumnKey(column);
  const selectedKey = normalizeOptionKey(value ?? resolveEditValue(column, row));
  const options = useMemo(() => {
    const localOptions = buildOptionsFromColumn(column, getOptionsForColumn, storeName);
    const remoteOptions = mapOptions(column, loadedItems, storeName);

    if (remoteOptions.length === 0) {
      return localOptions;
    }

    const seenKeys = new Set(remoteOptions.map(option => option.key));
    return [
      ...remoteOptions,
      ...localOptions.filter(option => !seenKeys.has(option.key)),
    ];
  }, [column, getOptionsForColumn, loadedItems, storeName]);
  const selected = options.find(option => option.key === selectedKey);
  const resolvedLabel =
    displayValue ??
    selected?.label ??
    resolveCellText({ column, columns, row, storeName, value });
  const canEdit = isEditableColumn(column) && typeof onStartEditing === 'function';
  const isForm = variant === 'form';
  const filteredOptions = useMemo(() => {
    const query = normalizeText(searchText).toLowerCase();
    if (!query || onSearchChange) return options;
    return options.filter(option =>
      normalizeText(option.label).toLowerCase().includes(query) ||
      normalizeText(option.key).toLowerCase().includes(query),
    );
  }, [options, searchText]);

  const applyLoadedItems = useCallback(value => {
    const nextItems = normalizeCollectionItems(value);
    if (nextItems.length > 0 || Array.isArray(value)) {
      setLoadedItems(nextItems);
    }
  }, []);

  const loadRemoteOptions = useCallback((searchValue = '') => {
    const listStoreName = resolveStoreNameFromList(column?.list);
    const actionName = resolveListActionName(column?.list);
    const stores = getAllStores?.() || {};
    const listStore = stores?.[listStoreName];
    const listAction = listStore?.actions?.[actionName];

    if (!listStoreName || typeof listAction !== 'function') {
      return Promise.resolve([]);
    }

    const listLoadParams = resolveColumnListLoadParams({
      column,
      currentCompanyId,
      requestParams,
      searchValue,
    });
    const loadKey = `${getColumnKey(column)}:${listStoreName}:${actionName}:${stableSerialize(listLoadParams)}`;

    if (
      !normalizeText(searchValue) &&
      loadedListKeysRef.current.has(loadKey) &&
      loadedItems.length > 0
    ) {
      return Promise.resolve(loadedItems);
    }

    if (!normalizeText(searchValue)) {
      loadedListKeysRef.current.add(loadKey);
    }

    return Promise.resolve(
      listAction({
        ...listLoadParams,
        __storeMeta: {
          dedupeKey: `default-select-list-options:${loadKey}`,
          skipSystemError: true,
        },
      }),
    )
      .then(response => {
        applyLoadedItems(response);
        return response;
      })
      .catch(error => {
        loadedListKeysRef.current.delete(loadKey);
        throw error;
      });
  }, [applyLoadedItems, column, currentCompanyId, loadedItems, requestParams]);

  const handleSearchChange = useCallback(value => {
    setSearchText(value);
    const maybeLoad = onSearchChange ? onSearchChange(value) : loadRemoteOptions(value);
    if (maybeLoad && typeof maybeLoad.then === 'function') {
      maybeLoad.then(applyLoadedItems).catch(() => {});
      return;
    }

    applyLoadedItems(maybeLoad);
  }, [applyLoadedItems, loadRemoteOptions, onSearchChange]);

  const close = () => {
    setIsOpen(false);
    setSearchText('');
    if (autoSave) onCancelEditing?.();
  };

  const selectOption = option => {
    setIsOpen(false);
    setSearchText('');

    if (autoSave) {
      onSave?.({
        value: option.key,
        label: option.label,
        object: option.raw,
      });
      return;
    }

    onChangeValue?.(option.key, {
      value: option.key,
      label: option.label,
      object: option.raw,
    });
  };

  const open = async () => {
    if (!canEdit && !isForm) return;
    try {
      if (!editing && !isForm) {
        const maybePromise = onStartEditing?.();
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
      }

      const maybeLoad = onBeforeOpen?.();
      if (maybeLoad && typeof maybeLoad.then === 'function') {
        applyLoadedItems(await maybeLoad);
      } else {
        applyLoadedItems(maybeLoad);
      }
    } catch (error) {
      return;
    }
    setIsOpen(true);
    loadRemoteOptions().catch(() => {});
  };

  return (
    <View style={[inputStyles.wrap, containerStyle]}>
      {showLabel ? <Text style={inputStyles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}

      <TouchableOpacity
        style={[inputStyles.readButton, isForm ? inputStyles.readButtonForm : null]}
        activeOpacity={canEdit || isForm ? 0.78 : 1}
        disabled={!canEdit && !isForm}
        onPress={open}
      >
        <Text
          style={[
            inputStyles.readText,
            resolvedLabel === '-' ? inputStyles.mutedText : null,
            readTextStyle,
          ]}
          numberOfLines={numberOfLines}
        >
          {resolvedLabel || '-'}
        </Text>
        {saving ? (
          <Text style={[inputStyles.savingText, { color: accentColor }]}>Salvando</Text>
        ) : canEdit || isForm ? (
          <Icon style={inputStyles.editIcon} name="chevron-down" size={14} color="#64748B" />
        ) : null}
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {label || column?.label || fieldName}
              </Text>
              <TouchableOpacity style={inputStyles.cancelButton} onPress={close}>
                <Icon name="x" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                style={[inputStyles.input, inputStyles.formInput]}
                value={searchText}
                placeholder={global.t?.t(storeName, 'input', column?.searchParam || 'search')}
                onChangeText={handleSearchChange}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => {
                  const isSelected = option.key === selectedKey;
                  return (
                    <TouchableOpacity
                      key={`${option.key}_${option.label}`}
                      style={styles.optionRow}
                      activeOpacity={0.78}
                      onPress={() => selectOption(option)}
                    >
                      <Icon
                        name={isSelected ? 'check-circle' : 'circle'}
                        size={15}
                        color={isSelected ? accentColor : '#CBD5E1'}
                      />
                      <Text style={styles.optionText}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    Nenhum resultado encontrado
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DefaultSelect;

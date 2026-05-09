import React, { useEffect, useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import styles from './DefaultSearch.styles';

const normalizeText = value => String(value || '').trim();

const DefaultSearch = ({
  accentColor = '#2563EB',
  autoFocus = false,
  compact = false,
  filters = null,
  onChangeFilters = null,
  onClear = null,
  onSearch = null,
  placeholder = '',
  searchKey = 'search',
  storeName = '',
  style = null,
  value,
}) => {
  const resolvedValue = useMemo(
    () => normalizeText(value ?? filters?.[searchKey]),
    [filters, searchKey, value],
  );
  const [draftValue, setDraftValue] = useState(resolvedValue);

  useEffect(() => {
    setDraftValue(resolvedValue);
  }, [resolvedValue]);

  const commitSearch = nextValue => {
    const searchValue = normalizeText(nextValue ?? draftValue);

    if (typeof onChangeFilters === 'function') {
      const nextFilters = { ...(filters || {}) };
      if (searchValue) nextFilters[searchKey] = searchValue;
      else delete nextFilters[searchKey];
      onChangeFilters(nextFilters);
    }

    onSearch?.(searchValue);
  };

  const clearSearch = () => {
    setDraftValue('');

    if (typeof onChangeFilters === 'function') {
      const nextFilters = { ...(filters || {}) };
      delete nextFilters[searchKey];
      onChangeFilters(nextFilters);
    }

    onClear?.();
    onSearch?.('');
  };

  const resolvedPlaceholder =
    placeholder ||
    global.t?.t(storeName, 'input', searchKey) ||
    global.t?.t(storeName, 'placeholder', searchKey) ||
    'Buscar...';

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null, style]}>
      <Icon name="search" size={compact ? 14 : 16} color="#64748B" />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        placeholder={resolvedPlaceholder}
        placeholderTextColor="#94A3B8"
        returnKeyType="search"
        style={[styles.input, compact ? styles.inputCompact : null]}
        value={draftValue}
        onChangeText={setDraftValue}
        onSubmitEditing={() => commitSearch()}
      />
      {draftValue ? (
        <TouchableOpacity
          style={[styles.iconButton, compact ? styles.iconButtonCompact : null]}
          activeOpacity={0.82}
          onPress={clearSearch}
        >
          <Icon name="x" size={14} color="#64748B" />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={[
          styles.searchButton,
          compact ? styles.searchButtonCompact : null,
          { borderColor: accentColor },
        ]}
        activeOpacity={0.82}
        onPress={() => commitSearch()}
      >
        <Icon name="arrow-right" size={compact ? 13 : 15} color={accentColor} />
      </TouchableOpacity>
    </View>
  );
};

export default DefaultSearch;

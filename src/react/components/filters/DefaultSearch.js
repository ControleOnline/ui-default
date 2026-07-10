import React, { useEffect, useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import styles from './DefaultSearch.styles';

const normalizeText = value => String(value || '').trim();

const DefaultSearch = ({
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
  const themeStore = useStore('theme');
  const themeColors = themeStore?.getters?.colors || {};
  const palette = useMemo(
    () => ({
      buttonBackgroundSecondary: themeColors.buttonBackgroundSecondary,
      buttonBorder: themeColors.buttonBorder,
      buttonIcon: themeColors.buttonIcon,
      buttonIconSecondary: themeColors.buttonIconSecondary,
      inputBackground: themeColors.inputBackground,
      inputBorder: themeColors.inputBorder,
      inputIcon: themeColors.inputIcon,
      inputPlaceholderText: themeColors.inputPlaceholderText,
      inputText: themeColors.inputText,
    }),
    [themeColors],
  );
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
    <View
      style={[
        styles.wrap,
        compact ? styles.wrapCompact : null,
        {
          backgroundColor: palette.inputBackground,
          borderColor: palette.inputBorder,
        },
        style,
      ]}
    >
      <Icon name="search" size={compact ? 14 : 16} color={palette.inputIcon} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={palette.inputPlaceholderText}
        returnKeyType="search"
        style={[
          styles.input,
          compact ? styles.inputCompact : null,
          { color: palette.inputText },
        ]}
        value={draftValue}
        onChangeText={setDraftValue}
        onSubmitEditing={() => commitSearch()}
      />
      {draftValue ? (
        <TouchableOpacity
          style={[
            styles.iconButton,
            compact ? styles.iconButtonCompact : null,
            { backgroundColor: palette.buttonBackgroundSecondary },
          ]}
          activeOpacity={0.82}
          onPress={clearSearch}
        >
          <Icon name="x" size={14} color={palette.buttonIconSecondary} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={[
          styles.searchButton,
          compact ? styles.searchButtonCompact : null,
          {
            backgroundColor: palette.buttonBackgroundSecondary,
            borderColor: palette.buttonBorder,
          },
        ]}
        activeOpacity={0.82}
        onPress={() => commitSearch()}
      >
        <Icon name="arrow-right" size={compact ? 13 : 15} color={palette.buttonIcon} />
      </TouchableOpacity>
    </View>
  );
};

export default DefaultSearch;

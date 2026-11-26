import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/Feather';
import {
  formatStoreColumnLabel,
  resolveStoreColumn,
  resolveStoreConfigByName,
} from '@controleonline/ui-common/src/react/utils/storeColumns';
import { isValidFeatherIcon } from '../inputs/defaultInputUtils';
import createStyles from './CompactFilterSelector.styles';
import {DefaultTableThemeContext} from '../table/useDefaultTableTheme';
import DefaultCompactFilterPicker from './DefaultCompactFilterPicker';

// Every value comes from the DOMAIN theme (no literal colors, no accent math).
const buildTheme = ({ themeColors = {} }) => ({
  accentColor: themeColors.defaultFilter_buttonPressedBorder,
  activeBackgroundColor: themeColors.defaultFilter_chipSelectedBackground,
  activeIconBackgroundColor: themeColors.defaultFilter_chipSelectedBackground,
  activeChevronColor: themeColors.defaultFilter_buttonPressedIcon,
  activeIconColor: themeColors.defaultFilter_buttonPressedIcon,
  activeTextColor: themeColors.defaultFilter_chipSelectedText,
  backgroundColor: themeColors.defaultFilter_inputBackground,
  borderColor: themeColors.defaultFilter_inputBorder,
  captionColor: themeColors.defaultFilter_textSecondary,
  chevronColor: themeColors.defaultFilter_inputIcon,
  closeIconColor: themeColors.defaultFilter_modalCloseIcon,
  iconBackgroundColor: themeColors.defaultFilter_chipBackground,
  iconColor: themeColors.defaultFilter_inputIcon,
  modalBackgroundColor: themeColors.defaultFilter_modalBackground,
  modalOverlayColor: themeColors.defaultFilter_modalOverlay,
  modalTitleColor: themeColors.defaultFilter_modalHeaderText,
  optionBackgroundColor: themeColors.defaultFilter_listItemBackground,
  optionBorderColor: themeColors.defaultFilter_listItemBorder,
  optionSelectedTextColor: themeColors.defaultFilter_chipSelectedText,
  textColor: themeColors.defaultFilter_inputText,
});

const noop = () => {};

const normalizeText = value => String(value || '').trim();

const resolveStoreName = store => {
  if (typeof store === 'string') return normalizeText(store);
  return normalizeText(store?.storeName || store?.name || '');
};

const resolveStoreFieldLabel = ({ fallbackLabel = '', field = '', store = '' }) => {
  const storeName = resolveStoreName(store);
  const fieldName = normalizeText(field);
  if (!storeName || !fieldName) return fallbackLabel;

  const { columns } = resolveStoreConfigByName(storeName);
  const column = resolveStoreColumn(columns, fieldName);
  const labelKey = normalizeText(column?.label || fieldName);
  const translatedLabel =
    global.t?.t(storeName, 'label', labelKey) ||
    global.t?.t(storeName, 'input', labelKey);

  return (
    translatedLabel ||
    formatStoreColumnLabel({
      columns,
      fallbackLabel: fallbackLabel || labelKey,
      fieldName,
      storeName,
    }) ||
    fallbackLabel
  );
};

const CompactFilterSelector = ({
  accentColor = null,
  active = false,
  children = null,
  dense = false,
  disabled = false,
  icon = 'sliders',
  label = '',
  labelCaption = '',
  onClose = null,
  onBeforeOpen = null,
  onSearchChange = null,
  onSelect = null,
  options = [],
  searchable = false,
  selectedKey = '',
  field = '',
  store = '',
  themeColors = {},
  title = '',
}) => {
  const compactTheme = useContext(DefaultTableThemeContext);
  const themeStore = useStore('theme');
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { width: windowWidth } = useWindowDimensions();
  const themeStoreColors = themeStore?.getters?.colors || {};
  const resolvedTheme = useMemo(
    () => buildTheme({
      themeColors: {
        ...themeStoreColors,
        ...themeColors,
      },
    }),
    [themeColors, themeStoreColors],
  );
  const styles = useMemo(
    () => createStyles(resolvedTheme, dense, windowWidth),
    [dense, resolvedTheme, windowWidth],
  );
  const storeFieldLabel = resolveStoreFieldLabel({
    fallbackLabel: labelCaption || title,
    field,
    store,
  });
  const resolvedLabelCaption = labelCaption || storeFieldLabel;
  const resolvedTitle = title || storeFieldLabel;
  const selectedOption = useMemo(
    () => options.find(option => option?.key === selectedKey),
    [options, selectedKey],
  );
  const selectedOptionColor = normalizeText(selectedOption?.color);
  const selectedOptionIcon = normalizeText(selectedOption?.icon);
  const selectedOptionIconName = isValidFeatherIcon(selectedOptionIcon)
    ? selectedOptionIcon
    : '';
  const triggerIconName = active && selectedOptionIconName
    ? selectedOptionIconName
    : icon;
  const triggerIconColor = active
    ? selectedOptionColor || resolvedTheme.activeIconColor
    : resolvedTheme.iconColor;

  const closeModal = useCallback(() => {
    setVisible(false);
    setSearchText('');
    onClose?.();
  }, [onClose]);

  const openModal = useCallback(() => {
    if (disabled) {
      return;
    }

    try {
      const maybePromise = onBeforeOpen?.();
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise
          .then(() => {
            setVisible(true);
          })
          .catch(() => {
            // Keep the modal closed if the lazy load fails.
          });
        return;
      }
    } catch (error) {
      return;
    }

    setVisible(true);
  }, [disabled, onBeforeOpen]);

  /*
   * @agents
   * List filters must keep the column/store contract in the default component:
   * open loads the initial page, typing delegates autocomplete to the caller
   * that knows the column list store/action.
   */
  const handleSearchChange = useCallback(value => {
    setSearchText(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalizeText(searchText).toLowerCase();
    if (!searchable || onSearchChange || !normalizedSearch) return options;

    return options.filter(option =>
      normalizeText(option?.label).toLowerCase().includes(normalizedSearch) ||
      normalizeText(option?.key).toLowerCase().includes(normalizedSearch),
    );
  }, [onSearchChange, options, searchable, searchText]);

  const handleSelect = useCallback(optionKey => {
    const shouldClose = onSelect?.(optionKey, {
      close: closeModal,
      open: openModal,
    });

    if (shouldClose !== false) {
      closeModal();
    }
  }, [closeModal, onSelect, openModal]);

  const resolvedChildren = useMemo(() => {
    if (typeof children === 'function') {
      return children({ close: closeModal, open: openModal });
    }

    return children;
  }, [children, closeModal, openModal]);

  if (compactTheme?.compact) return <DefaultCompactFilterPicker visible={visible} disabled={disabled}
    label={label} title={resolvedTitle} selectedKey={selectedKey} options={filteredOptions} searchText={searchText}
    searchable={searchable} onSearch={handleSearchChange} onOpen={openModal} onClose={closeModal} onSelect={handleSelect}>
    {resolvedChildren}
  </DefaultCompactFilterPicker>;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          active ? styles.triggerActive : null,
        ]}
        activeOpacity={0.9}
        disabled={disabled}
        onPress={openModal}
      >
        <View style={[styles.iconWrap, active ? styles.iconWrapActive : null]}>
          {active && selectedOption?.image ? (
            <Image
              source={selectedOption.image}
              style={styles.triggerIconImage}
              resizeMode="contain"
            />
          ) : (
            <Icon
              name={triggerIconName}
              size={dense ? 14 : 15}
              color={triggerIconColor}
            />
          )}
        </View>

        <View style={styles.textWrap}>
          {!!resolvedLabelCaption && (
            <Text
              numberOfLines={1}
              style={[
                styles.triggerCaption,
                active ? styles.triggerCaptionActive : null,
                active && selectedOptionColor ? { color: selectedOptionColor } : null,
              ]}
            >
              {resolvedLabelCaption}
            </Text>
          )}

          <Text
            numberOfLines={1}
            style={[
              styles.triggerText,
              active ? styles.triggerTextActive : null,
              active && selectedOptionColor ? { color: selectedOptionColor } : null,
            ]}
          >
            {label}
          </Text>
        </View>

        <Icon
          name="chevron-down"
          size={dense ? 14 : 16}
          color={active ? resolvedTheme.activeChevronColor : resolvedTheme.chevronColor}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={noop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{resolvedTitle}</Text>

                  <TouchableOpacity onPress={closeModal} activeOpacity={0.8}>
                    <Icon name="x" size={20} color={resolvedTheme.closeIconColor} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchable ? (
                    <TextInput
                      style={styles.searchInput}
                      value={searchText}
                      placeholder={global.t?.t(resolveStoreName(store), 'input', 'search')}
                      onChangeText={handleSearchChange}
                    />
                  ) : null}

                  {filteredOptions.map(option => {
                    const isSelected = option.key === selectedKey;
                    const optionColor = normalizeText(option?.color);
                    const optionIcon = normalizeText(option?.icon);
                    const optionIconName = isValidFeatherIcon(optionIcon)
                      ? optionIcon
                      : '';
                    const shouldRenderOptionFallbackText = Boolean(
                      !option?.image &&
                      !optionIconName &&
                      optionColor &&
                      normalizeText(option?.label),
                    );
                    const hasOptionVisual = Boolean(option?.image || optionIconName || shouldRenderOptionFallbackText);

                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.modalOption,
                          isSelected ? styles.modalOptionActive : null,
                        ]}
                        activeOpacity={0.9}
                        onPress={() => handleSelect(option.key)}
                      >
                        {option?.image ? (
                          <Image
                            source={option.image}
                            style={styles.modalOptionImage}
                            resizeMode="contain"
                          />
                        ) : optionIconName ? (
                          <Icon
                            style={styles.modalOptionIcon}
                            name={optionIconName}
                            size={16}
                            color={optionColor || resolvedTheme.iconColor}
                          />
                        ) : shouldRenderOptionFallbackText ? (
                          <Text
                            style={[
                              styles.modalOptionFallbackText,
                              { color: optionColor },
                            ]}
                            numberOfLines={1}
                          >
                            {option.label}
                          </Text>
                        ) : null}

                        {shouldRenderOptionFallbackText ? null : (
                          <Text
                            style={[
                              styles.modalOptionText,
                              isSelected ? styles.modalOptionTextActive : null,
                              optionColor ? { color: optionColor } : null,
                              !hasOptionVisual ? styles.modalOptionTextNoVisual : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                        )}

                        {isSelected ? (
                          <Icon
                            name="check"
                            size={16}
                            color={optionColor || resolvedTheme.activeIconColor}
                          />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}

                  {resolvedChildren}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default CompactFilterSelector;

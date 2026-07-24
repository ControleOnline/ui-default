import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import DefaultColumnMenu from './DefaultColumnMenu';
import DefaultDebug from './DefaultDebug';
import DefaultFiltersModal from './DefaultFiltersModal';
import DefaultModalButton from './DefaultModalButton';
import styles from './DefaultTable.styles';
import { normalizeText } from '../inputs/defaultInputUtils';
import { shouldIncludeColumn } from './DefaultTable.utils';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableControls = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const effectiveViewMode = configs.viewMode || configs.initialViewMode || 'table';
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const filters = store?.getters?.filters || {};
  const hasTableFilters = columns.some(
    column =>
      configs.showColumnFiltersButton !== false &&
      shouldIncludeColumn(column) &&
      column?.filter !== false &&
      column?.filters !== false,
  );
  const activeFilterCount = Object.values(filters).filter(value => normalizeText(value) !== '').length;
  const addConfig = store?.getters?.add;
  const shouldRenderAddButton =
    (addConfig === true || configs.add === true) &&
    (typeof configs.onAdd === 'function' || typeof store?.actions?.save === 'function');
  const { tableButtonColors } = useDefaultTableTheme();
  const {
    backgroundColor,
    borderColor,
    iconColor,
    pressedBackgroundColor,
    pressedBorderColor,
    pressedIconColor,
    textColor,
  } = tableButtonColors;

  const buttonStyle = [
    styles.toolbarButton,
    { borderColor, backgroundColor },
  ];
  const pressedStyle = {
    backgroundColor: pressedBackgroundColor,
    borderColor: pressedBorderColor,
  };

  return (
    <>
      <DefaultDebug storeName={storeName} />
      {hasTableFilters ? (
        <DefaultModalButton
          renderButton={({ isOpen, open }) => (
            <TouchableOpacity
              style={[
                ...buttonStyle,
                isOpen ? pressedStyle : null,
              ]}
              activeOpacity={0.82}
              onPress={open}
            >
              <Icon
                name="filter"
                size={14}
                color={isOpen ? pressedIconColor : iconColor}
              />
              {activeFilterCount > 0 ? (
                <Text
                  style={[
                    styles.toolbarBadgeText,
                    { color: isOpen ? pressedIconColor : iconColor },
                  ]}>
                  {activeFilterCount}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        >
          {({ close, isOpen }) => (
            <DefaultFiltersModal
              storeName={storeName}
              visible={isOpen}
              onClose={close}
            />
          )}
        </DefaultModalButton>
      ) : null}
      <TouchableOpacity
        style={[
          ...buttonStyle,
          effectiveViewMode !== 'table' ? pressedStyle : null,
        ]}
        activeOpacity={0.82}
        onPress={() => {
          const nextConfigs = {
            ...configs,
            viewMode: effectiveViewMode === 'table' ? 'cards' : 'table',
          };

          if (typeof store?.actions?.setConfigs === 'function') {
            store.actions.setConfigs(nextConfigs);
            return;
          }

          if (store?.getters) {
            store.getters.configs = nextConfigs;
          }
        }}
      >
        <Icon
          name={effectiveViewMode === 'table' ? 'list' : 'grid'}
          size={14}
          color={effectiveViewMode !== 'table' ? pressedIconColor : iconColor}
        />
      </TouchableOpacity>
      <DefaultModalButton
        renderButton={({ isOpen, toggle }) => (
          <TouchableOpacity
            style={[
              ...buttonStyle,
              isOpen ? pressedStyle : null,
            ]}
            activeOpacity={0.82}
            onPress={toggle}
          >
            <Icon name="columns" size={14} color={isOpen ? pressedIconColor : textColor} />
          </TouchableOpacity>
        )}
      >
        {({ close, isOpen }) => (
          <DefaultColumnMenu
            storeName={storeName}
            visible={isOpen}
            onClose={close}
          />
        )}
      </DefaultModalButton>
      {shouldRenderAddButton ? (
        <TouchableOpacity
          style={[
            styles.toolbarButton,
            styles.toolbarAddButton,
            { backgroundColor: backgroundColor, borderColor: backgroundColor },
          ]}
          activeOpacity={0.85}
          onPress={() => configs.onAdd?.()}
        >
          <Icon name="plus" size={16} color={textColor} />
        </TouchableOpacity>
      ) : null}
    </>
  );
};

export default DefaultTableControls;

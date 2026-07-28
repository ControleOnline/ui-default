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
import {
  persistTableViewModePreference,
  resolveDefaultTablePreferenceScope,
} from '../../utils/tableVisibleColumnsPreferences';
import { shouldIncludeColumn } from './DefaultTable.utils';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableControls = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const effectiveViewMode =
    configs.effectiveViewMode ||
    configs.viewMode ||
    configs.initialViewMode ||
    'table';
  const tablePreferenceScope =
    configs.tablePreferenceScope ||
    resolveDefaultTablePreferenceScope({ storeName });
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const filters = store?.getters?.filters || {};
  const hasFilterableColumns = columns.some(
    column =>
      configs.showColumnFiltersButton !== false &&
      shouldIncludeColumn(column) &&
      column?.filter !== false &&
      column?.filters !== false,
  );
  const tableFiltersVisible = Boolean(configs.tableFiltersVisible);
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
  const updateConfigs = nextConfigs => {
    if (typeof store?.actions?.setConfigs === 'function') {
      store.actions.setConfigs(nextConfigs);
      return;
    }

    if (store?.getters) {
      store.getters.configs = nextConfigs;
    }
  };
  const nextViewMode = effectiveViewMode === 'table' ? 'cards' : 'table';

  return (
    <>
      <DefaultDebug storeName={storeName} />
      {hasFilterableColumns && effectiveViewMode === 'table' ? (
        <TouchableOpacity
          style={[
            ...buttonStyle,
            tableFiltersVisible ? pressedStyle : null,
          ]}
          activeOpacity={0.82}
          onPress={() =>
            updateConfigs({
              ...configs,
              tableFiltersVisible: !tableFiltersVisible,
            })
          }
        >
          <Icon
            name="filter"
            size={14}
            color={tableFiltersVisible ? pressedIconColor : textColor}
          />
          {activeFilterCount > 0 ? (
            <Text
              style={[
                styles.toolbarBadgeText,
                { color: tableFiltersVisible ? pressedIconColor : textColor },
              ]}
            >
              {activeFilterCount}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : null}
      {hasFilterableColumns && effectiveViewMode === 'cards' ? (
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
                color={isOpen ? pressedIconColor : textColor}
              />
              {activeFilterCount > 0 ? (
                <Text
                  style={[
                    styles.toolbarBadgeText,
                    { color: isOpen ? pressedIconColor : textColor },
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
        style={buttonStyle}
        activeOpacity={0.82}
        onPress={() => {
          const nextConfigs = {
            ...configs,
            effectiveViewMode: nextViewMode,
            viewMode: nextViewMode,
          };

          persistTableViewModePreference(tablePreferenceScope, nextConfigs.viewMode);
          updateConfigs(nextConfigs);
        }}
      >
        <Icon
          name={nextViewMode === 'cards' ? 'grid' : 'list'}
          size={14}
          color={textColor}
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

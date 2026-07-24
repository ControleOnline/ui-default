import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultDebug from './DefaultDebug';
import styles from './DefaultTable.styles';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableControls = ({ storeName }) => {
  const {
    activeFilterCount = 0,
    effectiveViewMode = 'table',
    hasTableFilters = false,
    isColumnMenuOpen = false,
    isFiltersModalOpen = false,
    onAdd,
    onOpenFilters,
    onToggleColumnMenu,
    onToggleViewMode,
    shouldRenderAddButton = false,
  } = getDefaultTableRuntime(storeName);
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
        <TouchableOpacity
          style={[
            ...buttonStyle,
            isFiltersModalOpen ? pressedStyle : null,
          ]}
          activeOpacity={0.82}
          onPress={onOpenFilters}
        >
          <Icon
            name="filter"
            size={14}
            color={isFiltersModalOpen ? pressedIconColor : iconColor}
          />
          {activeFilterCount > 0 ? (
            <Text
              style={[
                styles.toolbarBadgeText,
                { color: isFiltersModalOpen ? pressedIconColor : iconColor },
              ]}>
              {activeFilterCount}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={[
          ...buttonStyle,
          effectiveViewMode !== 'table' ? pressedStyle : null,
        ]}
        activeOpacity={0.82}
        onPress={onToggleViewMode}
      >
        <Icon
          name={effectiveViewMode === 'table' ? 'list' : 'grid'}
          size={14}
          color={effectiveViewMode !== 'table' ? pressedIconColor : iconColor}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          ...buttonStyle,
          isColumnMenuOpen ? pressedStyle : null,
        ]}
        activeOpacity={0.82}
        onPress={onToggleColumnMenu}
      >
        <Icon name="columns" size={14} color={isColumnMenuOpen ? pressedIconColor : textColor} />
      </TouchableOpacity>
      {shouldRenderAddButton ? (
        <TouchableOpacity
          style={[
            styles.toolbarButton,
            styles.toolbarAddButton,
            { backgroundColor: backgroundColor, borderColor: backgroundColor },
          ]}
          activeOpacity={0.85}
          onPress={onAdd}
        >
          <Icon name="plus" size={16} color={textColor} />
        </TouchableOpacity>
      ) : null}
    </>
  );
};

export default DefaultTableControls;

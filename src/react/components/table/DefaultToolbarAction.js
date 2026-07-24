import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { normalizeText } from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultToolbarAction = ({ action }) => {
  const { tableActionColors } = useDefaultTableTheme();
  const {
    backgroundColor: tableActionBackgroundColor,
    borderColor: tableActionBorderColor,
    textColor: tableActionTextColor,
  } = tableActionColors;

  if (!action || action.hidden) return null;

  const hasLabel = normalizeText(action.label) !== '';
  const actionColor = action.color || tableActionTextColor;

  return (
    <TouchableOpacity
      key={action.key || action.icon || action.label}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel || action.label || action.key || action.icon}
      style={[
        styles.toolbarButton,
        { backgroundColor: tableActionBackgroundColor, borderColor: tableActionBorderColor },
        action.style,
      ]}
      activeOpacity={0.82}
      disabled={action.disabled === true}
      onPress={action.onPress}
    >
      {action.icon ? (
        <Icon
          name={action.icon}
          size={action.iconSize || 14}
          color={actionColor}
        />
      ) : null}
      {hasLabel ? (
        <Text style={[styles.toolbarActionLabel, { color: actionColor }, action.labelStyle]} numberOfLines={1}>
          {action.label}
        </Text>
      ) : null}
      {action.badge !== undefined && action.badge !== null ? (
        <Text style={[styles.toolbarBadgeText, { color: action.badgeColor || tableActionTextColor }]}>
          {action.badge}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default DefaultToolbarAction;

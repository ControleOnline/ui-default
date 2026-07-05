import React, {useCallback} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import styles from './DefaultTooltip.styles';

const DefaultTooltip = ({
  accentColor = '#0EA5E9',
  label = '?',
  message = '',
  style = null,
  textStyle = null,
  title = 'Ajuda',
}) => {
  const handlePress = useCallback(() => {
    if (!message) {
      return;
    }

    Alert.alert(title, message);
  }, [message, title]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      disabled={!message}
      onPress={handlePress}
      style={[
        styles.button,
        {
          borderColor: accentColor,
          backgroundColor: `${accentColor}14`,
        },
        !message && {opacity: 0.55},
        style,
      ]}
    >
      <Text style={[styles.label, {color: accentColor}, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default DefaultTooltip;

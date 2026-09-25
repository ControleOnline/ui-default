import React, {useCallback, useState} from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import styles from './DefaultTooltip.styles';

const DefaultTooltip = ({
  accentColor = '#0EA5E9',
  label = '?',
  message = '',
  rows = [],
  style = null,
  textStyle = null,
  title = 'Ajuda',
  testID,
  backdropTestID,
  dialogTestID,
  closeAccessibilityLabel,
  closeLabel = 'Fechar',
  accessibilityLabel,
}) => {
  const [visible, setVisible] = useState(false);

  const openTooltip = useCallback(() => {
    if (!message && rows.length === 0) {
      return;
    }

    setVisible(true);
  }, [message, rows.length]);

  const closeTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.85}
        disabled={!message && rows.length === 0}
        onPress={openTooltip}
        style={[
          styles.button,
          {
            borderColor: accentColor,
            backgroundColor: `${accentColor}14`,
          },
          !message && rows.length === 0 && {opacity: 0.55},
          style,
        ]}
        testID={testID}>
        <Text style={[styles.label, {color: accentColor}, textStyle]}>
          {label}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        onRequestClose={closeTooltip}
        transparent
        visible={visible}>
        <Pressable
          style={styles.overlay}
          onPress={closeTooltip}
          testID={backdropTestID}>
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.card,
              {
                borderColor: accentColor,
              },
            ]}>
            <View testID={dialogTestID}>
              <View style={styles.cardHeader}>
                <Text style={[styles.title, {color: accentColor}]}>{title}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={closeAccessibilityLabel}
                  activeOpacity={0.8}
                  onPress={closeTooltip}
                  style={[
                    styles.closeButton,
                    {
                      borderColor: accentColor,
                    },
                  ]}>
                  <Text style={[styles.closeButtonText, {color: accentColor}]}>
                    {closeLabel}
                  </Text>
                </TouchableOpacity>
              </View>
              {rows.length > 0 ? (
                <View style={styles.rows}>
                  {rows.map(row => (
                    <View key={row.key || row.label} style={styles.row}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.message}>{message}</Text>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default DefaultTooltip;

import React, {useCallback, useState} from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import styles from './DefaultTooltip.styles';

const DefaultTooltip = ({
  accentColor = '#0EA5E9',
  accessibilityLabel = 'Abrir ajuda',
  backdropTestID,
  children = null,
  closeAccessibilityLabel = 'Fechar ajuda',
  closeLabel = 'Fechar',
  dialogTestID,
  hitSlop,
  label = '?',
  message = '',
  rows = [],
  style = null,
  testID,
  textStyle = null,
  title = 'Ajuda',
}) => {
  const [visible, setVisible] = useState(false);
  const hasRows = Array.isArray(rows) && rows.length > 0;
  const hasContent = Boolean(message || children || hasRows);

  const openTooltip = useCallback(() => {
    if (!hasContent) {
      return;
    }

    setVisible(true);
  }, [hasContent]);

  const closeTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        activeOpacity={0.85}
        disabled={!hasContent}
        hitSlop={hitSlop}
        onPress={openTooltip}
        style={[
          styles.button,
          {
            borderColor: accentColor,
            backgroundColor: `${accentColor}14`,
          },
          !hasContent && {opacity: 0.55},
          style,
        ]}
        testID={testID}>
        {React.isValidElement(label) ? (
          label
        ) : (
          <Text style={[styles.label, {color: accentColor}, textStyle]}>
            {label}
          </Text>
        )}
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
            accessibilityLabel={title}
            accessibilityRole="summary"
            onStartShouldSetResponder={() => true}
            style={[
              styles.card,
              {
                borderColor: accentColor,
              },
            ]}
            testID={dialogTestID}>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, {color: accentColor}]}>{title}</Text>
              <TouchableOpacity
                accessibilityLabel={closeAccessibilityLabel}
                accessibilityRole="button"
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
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {hasRows
              ? rows.map(row => (
                  <View key={row.key || row.label} style={styles.row}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowValue}>
                      {String(row.value ?? 'Não configurado')}
                    </Text>
                  </View>
                ))
              : null}
            {children}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default DefaultTooltip;

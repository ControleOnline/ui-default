import React, {useCallback, useState} from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import styles from './DefaultTooltip.styles';

const DefaultTooltip = ({
  accentColor = '#0EA5E9',
  label = '?',
  message = '',
  style = null,
  textStyle = null,
  title = 'Ajuda',
}) => {
  const [visible, setVisible] = useState(false);

  const openTooltip = useCallback(() => {
    if (!message) {
      return;
    }

    setVisible(true);
  }, [message]);

  const closeTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        disabled={!message}
        onPress={openTooltip}
        style={[
          styles.button,
          {
            borderColor: accentColor,
            backgroundColor: `${accentColor}14`,
          },
          !message && {opacity: 0.55},
          style,
        ]}>
        <Text style={[styles.label, {color: accentColor}, textStyle]}>
          {label}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        onRequestClose={closeTooltip}
        transparent
        visible={visible}>
        <Pressable style={styles.overlay} onPress={closeTooltip}>
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.card,
              {
                borderColor: accentColor,
              },
            ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, {color: accentColor}]}>{title}</Text>
              <TouchableOpacity
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
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default DefaultTooltip;

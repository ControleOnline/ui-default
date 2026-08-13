import React, {useCallback, useMemo, useState} from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import {useStore} from '@store';
import FeatherIcon from 'react-native-vector-icons/Feather';

import createStyles from './DefaultTooltip.styles';

const DefaultTooltip = ({
  accentColor,
  label = '?',
  message = '',
  style = null,
  textStyle = null,
  title = 'Ajuda',
}) => {
  const themeStore = useStore('theme');
  const {colors: themeColors} = themeStore.getters;
  const palette = useMemo(
    () => ({
      buttonBackground: themeColors.buttonBackground,
      buttonBorder: themeColors.buttonBorder,
      buttonDisabledBackground: themeColors.buttonDisabledBackground,
      buttonIcon: themeColors.buttonIcon,
      iconBackground: themeColors.iconBackground,
      iconDisabled: themeColors.iconDisabled,
      iconInfo: themeColors.iconInfo,
      modalBackground: themeColors.modalBackground,
      modalBorder: themeColors.modalBorder,
      modalHeaderText: themeColors.modalHeaderText,
      modalOverlay: themeColors.modalOverlay,
      modalText: themeColors.modalText,
    }),
    [themeColors],
  );
  const styles = useMemo(() => createStyles(palette), [palette]);
  const activeAccentColor = accentColor || palette.iconInfo;
  const buttonColor = message ? activeAccentColor : palette.iconDisabled;
  const buttonBackground = message
    ? palette.iconBackground
    : palette.buttonDisabledBackground;
  const buttonBorder = message
    ? activeAccentColor
    : palette.buttonDisabledBackground;
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
        disabled={!message}
        onPress={openTooltip}
        style={[
          styles.button,
          {
            borderColor: buttonBorder,
            backgroundColor: buttonBackground,
          },
          style,
        ]}>
        <Text style={[styles.label, {color: buttonColor}, textStyle]}>
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
            style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={closeTooltip}
                style={styles.closeButton}>
                <FeatherIcon name="x" size={18} color={palette.buttonIcon} />
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

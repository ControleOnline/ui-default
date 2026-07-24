import { useMemo } from 'react';
import { useStore } from '@store';

const useDefaultTableTheme = (accentColor = null) => {
  const themeStore = useStore('theme');
  const themeColors = themeStore.getters.colors;
  const themeTokens = useMemo(
    () => ({ ...themeColors }),
    [themeColors],
  );
  const palette = themeColors;
  const resolvedAccentColor = accentColor ?? themeColors.primary;

  return {
    palette,
    resolvedAccentColor,
    themeColors,
    themeTokens,
    checkboxBorderColor: themeColors.checkboxBorder,
    checkboxSelectedMarkColor: themeColors.checkboxSelectedMark,
    modalColors: {
      backgroundColor: themeColors.modalBackground,
      borderColor: themeColors.modalBorder,
      closeIconColor: themeColors.modalCloseIcon,
      headerTextColor: themeColors.modalHeaderText,
      overlayColor: themeColors.modalOverlay,
      textColor: themeColors.modalText,
    },
    tableButtonColors: {
      backgroundColor: themeColors.buttonBackground,
      borderColor: themeColors.buttonBorder,
      iconColor: themeColors.buttonIcon,
      pressedBackgroundColor: themeColors.buttonPressedBackground,
      pressedBorderColor: themeColors.buttonPressedBorder,
      pressedIconColor: themeColors.buttonPressedIcon,
      textColor: themeColors.buttonText,
    },
    tableActionColors: {
      backgroundColor: themeColors.tableActionBackground,
      borderColor: themeColors.tableActionBorder,
      textColor: themeColors.tableActionIcon,
    },
    toolbarColors: {
      backgroundColor: themeColors.toolbarBackground,
      borderColor: themeColors.toolbarBorder,
      countBackgroundColor: themeColors.badgeBackground,
      countTextColor: themeColors.badgeText,
    },
  };
};

export default useDefaultTableTheme;

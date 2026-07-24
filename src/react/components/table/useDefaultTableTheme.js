import { useMemo } from 'react';
import { useStore } from '@store';
import { resolveThemePalette } from '@controleonline/../../src/styles/branding';
import { colors } from '@controleonline/../../src/styles/colors';

const useDefaultTableTheme = (accentColor = null) => {
  const themeStore = useStore('theme');
  const baseColors = themeStore?.getters?.colors || {};
  const themeTokens = useMemo(
    () => ({ ...baseColors }),
    [baseColors],
  );
  const palette = useMemo(
    () => resolveThemePalette(themeTokens, colors) || {},
    [themeTokens],
  );
  const themeColors = palette.colors || baseColors || colors || {};
  const resolvedAccentColor = accentColor || palette.primary || themeColors.primary || '#0EA5E9';

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

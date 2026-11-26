import { createContext, useContext, useMemo } from 'react';
import { useStore } from '@store';

export const DefaultTableThemeContext = createContext(null);

const firstThemeToken = (themeColors, keys) =>
  keys.map(key => themeColors?.[key]).find(Boolean);

const useDefaultTableTheme = (accentColor = null, appearance = 'default') => {
  const inheritedColors = useContext(DefaultTableThemeContext);
  const themeStore = useStore('theme');
  const rawThemeColors = themeStore?.getters?.colors || {};
  const themeColors = useMemo(
    () => inheritedColors || (appearance === 'compact' ? {...rawThemeColors, compact: true} : rawThemeColors),
    [rawThemeColors, inheritedColors, appearance],
  );
  const themeTokens = useMemo(
    () => ({ ...themeColors }),
    [themeColors],
  );
  const palette = themeColors;
  const resolvedAccentColor = appearance === 'compact' || inheritedColors ? themeColors.primary : accentColor ?? themeColors.primary;
  const tableBorderColors = {
    containerBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableHeaderBorder',
      'defaultTable_tableToolbarBorder',
      'defaultTable_cardBorder',
      'defaultTable_listItemBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
      'defaultTable_inputBorder',
      'defaultTable_panelBorder',
    ]),
    headerBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableHeaderBorder',
      'defaultTable_tableToolbarBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
      'defaultTable_listItemBorder',
    ]),
    rowBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableRowBorder',
      'defaultTable_listItemBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
    ]),
    toolbarBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableToolbarBorder',
      'defaultTable_tableHeaderBorder',
      'defaultTable_toolbarBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
    ]),
  };

  return {
    palette,
    resolvedAccentColor,
    tableBorderColors,
    themeColors,
    themeTokens,
    checkboxBorderColor: themeColors.defaultTable_checkboxBorder,
    checkboxSelectedMarkColor: themeColors.defaultTable_checkboxSelectedMark,
    modalColors: {
      backgroundColor: themeColors.defaultTable_modalBackground,
      borderColor: themeColors.defaultTable_modalBorder,
      closeIconColor: themeColors.defaultTable_modalCloseIcon,
      headerTextColor: themeColors.defaultTable_modalHeaderText,
      overlayColor: themeColors.defaultTable_modalOverlay,
      textColor: themeColors.defaultTable_modalText,
    },
    tableButtonColors: {
      backgroundColor: themeColors.defaultTable_buttonBackground,
      borderColor: themeColors.defaultTable_buttonBorder,
      iconColor: themeColors.defaultTable_buttonIcon,
      pressedBackgroundColor: themeColors.defaultTable_buttonPressedBackground,
      pressedBorderColor: themeColors.defaultTable_buttonPressedBorder,
      pressedIconColor: themeColors.defaultTable_buttonPressedIcon,
      textColor: themeColors.defaultTable_buttonText,
    },
    filterModalColors: {
      backgroundColor: themeColors.defaultFilter_modalBackground,
      borderColor: themeColors.defaultFilter_modalBorder,
      closeIconColor: themeColors.defaultFilter_modalCloseIcon,
      headerTextColor: themeColors.defaultFilter_modalHeaderText,
      overlayColor: themeColors.defaultFilter_modalOverlay,
      textColor: themeColors.defaultFilter_modalText,
    },
    filterCheckboxBorderColor: themeColors.defaultFilter_checkboxBorder,
    filterCheckboxSelectedMarkColor: themeColors.defaultFilter_checkboxSelectedMark,
    filterButtonColors: {
      backgroundColor: themeColors.defaultFilter_buttonBackground,
      borderColor: themeColors.defaultFilter_buttonBorder,
      iconColor: themeColors.defaultFilter_buttonIcon,
      textColor: themeColors.defaultFilter_buttonText,
    },
    filterButtonSecondaryColors: {
      backgroundColor: themeColors.defaultFilter_buttonBackgroundSecondary,
      borderColor: themeColors.defaultFilter_buttonBorderSecondary,
      iconColor: themeColors.defaultFilter_buttonIconSecondary,
      textColor: themeColors.defaultFilter_buttonTextSecondary,
    },
    filterButtonPressedColors: {
      backgroundColor: themeColors.defaultFilter_buttonPressedBackground,
      borderColor: themeColors.defaultFilter_buttonPressedBorder,
      iconColor: themeColors.defaultFilter_buttonPressedIcon,
      textColor: themeColors.defaultFilter_buttonPressedText,
    },
    filterInputColors: {
      backgroundColor: themeColors.defaultFilter_inputBackground,
      borderColor: themeColors.defaultFilter_inputBorder,
      iconColor: themeColors.defaultFilter_inputIcon,
      placeholderColor: themeColors.defaultFilter_inputPlaceholderText,
      textColor: themeColors.defaultFilter_inputText,
    },
    filterToolbarColors: {
      backgroundColor: themeColors.defaultFilter_toolbarBackground,
      borderColor: themeColors.defaultFilter_toolbarBorder,
      countBackgroundColor: themeColors.defaultFilter_badgeBackground,
      countTextColor: themeColors.defaultFilter_badgeText,
    },
    filterChipColors: {
      backgroundColor: themeColors.defaultFilter_chipBackground,
      borderColor: themeColors.defaultFilter_chipBorder,
      iconColor: themeColors.defaultFilter_chipIcon,
      textColor: themeColors.defaultFilter_chipText,
    },
    filterTextColors: {
      primary: themeColors.defaultFilter_textPrimary,
      secondary: themeColors.defaultFilter_textSecondary,
    },
    tableActionColors: {
      backgroundColor: themeColors.defaultTable_tableActionBackground,
      borderColor: themeColors.defaultTable_tableActionBorder,
      textColor: themeColors.defaultTable_tableActionIcon,
    },
    toolbarColors: {
      backgroundColor: themeColors.defaultTable_toolbarBackground,
      borderColor: themeColors.defaultTable_toolbarBorder,
      countBackgroundColor: themeColors.defaultTable_badgeBackground,
      countTextColor: themeColors.defaultTable_badgeText,
    },
  };
};

export default useDefaultTableTheme;

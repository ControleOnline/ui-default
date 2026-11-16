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
  const resolvedAccentColor = appearance === 'compact' || inheritedColors ? themeColors.defaultTable_primary : accentColor ?? themeColors.defaultTable_primary;
  const tableBorderColors = {
    containerBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableContainerBorder',
      'defaultTable_tableBorder',
      'defaultTable_tableHeaderBorder',
      'defaultTable_tableToolbarBorder',
      'defaultTable_cardBorder',
      'defaultTable_listItemBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
      'defaultTable_inputBorder',
      'defaultTable_panelBorder',
      'defaultTable_border',
    ]),
    headerBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableHeaderBorder',
      'defaultTable_tableToolbarBorder',
      'defaultTable_tableBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
      'defaultTable_listItemBorder',
      'defaultTable_border',
    ]),
    rowBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableRowBorder',
      'defaultTable_listItemBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
      'defaultTable_tableBorder',
      'defaultTable_border',
    ]),
    toolbarBorderColor: firstThemeToken(themeColors, [
      'defaultTable_tableToolbarBorder',
      'defaultTable_tableHeaderBorder',
      'defaultTable_toolbarBorder',
      'defaultTable_tableBorder',
      'defaultTable_dividerBorder',
      'defaultTable_dividerBackground',
      'defaultTable_border',
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

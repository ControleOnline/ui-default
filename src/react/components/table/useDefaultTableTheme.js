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
      'tableContainerBorder',
      'tableBorder',
      'tableHeaderBorder',
      'tableToolbarBorder',
      'cardBorder',
      'listItemBorder',
      'dividerBorder',
      'dividerBackground',
      'inputBorder',
      'panelBorder',
      'border',
    ]),
    headerBorderColor: firstThemeToken(themeColors, [
      'tableHeaderBorder',
      'tableToolbarBorder',
      'tableBorder',
      'dividerBorder',
      'dividerBackground',
      'listItemBorder',
      'border',
    ]),
    rowBorderColor: firstThemeToken(themeColors, [
      'tableRowBorder',
      'listItemBorder',
      'dividerBorder',
      'dividerBackground',
      'tableBorder',
      'border',
    ]),
    toolbarBorderColor: firstThemeToken(themeColors, [
      'tableToolbarBorder',
      'tableHeaderBorder',
      'toolbarBorder',
      'tableBorder',
      'dividerBorder',
      'dividerBackground',
      'border',
    ]),
  };

  return {
    palette,
    resolvedAccentColor,
    tableBorderColors,
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

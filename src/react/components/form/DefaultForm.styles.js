import { StyleSheet } from 'react-native';

export const createStyles = palette =>
  StyleSheet.create({
    body: {
      maxHeight: 520,
    },
    formGrid: {
      padding: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    formField: {
      flexGrow: 1,
      flexBasis: 220,
      minWidth: 220,
    },
    emptyBox: {
      padding: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: palette.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    actions: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderTopWidth: 1,
      borderTopColor: palette.dividerBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
    },
    secondaryButton: {
      height: 34,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.buttonBorderSecondary,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.buttonBackgroundSecondary,
    },
    secondaryButtonText: {
      color: palette.buttonTextSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    primaryButton: {
      height: 34,
      borderRadius: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonDisabled: {
      backgroundColor: palette.buttonDisabledBackground,
    },
    primaryButtonText: {
      color: palette.buttonText,
      fontSize: 12,
      fontWeight: '900',
    },
    primaryButtonTextDisabled: {
      color: palette.buttonDisabledText,
    },
  });

const styles = createStyles({});
export default styles;

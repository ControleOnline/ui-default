import { StyleSheet } from 'react-native';

const createStyles = (theme, dense = false, windowWidth = 0) => {
  const compactModal = Number(windowWidth) >= 768;

  return StyleSheet.create({
    trigger: {
      minWidth: 0,
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: dense ? 8 : 10,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: dense ? 12 : 14,
      paddingHorizontal: dense ? 10 : 12,
      paddingVertical: dense ? 8 : 10,
      backgroundColor: theme.backgroundColor,
    },
    triggerActive: {
      borderColor: theme.accentColor,
      backgroundColor: theme.activeBackgroundColor,
    },
    iconWrap: {
      width: dense ? 24 : 28,
      height: dense ? 24 : 28,
      borderRadius: dense ? 8 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.iconBackgroundColor,
    },
    iconWrapActive: {
      backgroundColor: theme.activeIconBackgroundColor,
    },
    triggerIconImage: {
      width: dense ? 16 : 18,
      height: dense ? 16 : 18,
      flexShrink: 0,
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
    },
    triggerCaption: {
      fontSize: dense ? 9 : 10,
      lineHeight: dense ? 10 : 12,
      fontWeight: '800',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: theme.captionColor,
      marginBottom: dense ? 1 : 2,
    },
    triggerCaptionActive: {
      color: theme.activeTextColor,
    },
    triggerText: {
      fontSize: dense ? 12 : 13,
      lineHeight: dense ? 14 : 16,
      fontWeight: dense ? '800' : '700',
      color: theme.textColor,
    },
    triggerTextActive: {
      color: theme.activeTextColor,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlayColor,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: compactModal ? 24 : 14,
    },
    modalCard: {
      width: '100%',
      maxWidth: compactModal ? 420 : undefined,
      backgroundColor: theme.modalBackgroundColor,
      borderRadius: 24,
      maxHeight: compactModal ? 560 : '82%',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.modalTitleColor,
    },
    modalScroll: {
      flexGrow: 0,
    },
    modalContent: {
      paddingBottom: 10,
      gap: 10,
    },
    searchInput: {
      minHeight: 42,
      borderWidth: 1,
      borderColor: theme.optionBorderColor,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      fontSize: 13,
      fontWeight: '700',
    },
    modalOption: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: theme.optionBorderColor,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.optionBackgroundColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    modalOptionIcon: {
      flexShrink: 0,
    },
    modalOptionImage: {
      width: 18,
      height: 18,
      flexShrink: 0,
    },
    modalOptionFallbackText: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      fontWeight: '800',
    },
    modalOptionActive: {
      borderColor: theme.accentColor,
      backgroundColor: theme.activeBackgroundColor,
    },
    modalOptionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: theme.textColor,
    },
    modalOptionTextNoVisual: {
      marginLeft: 0,
    },
    modalOptionTextActive: {
      color: theme.optionSelectedTextColor,
    },
  });
};

export default createStyles;

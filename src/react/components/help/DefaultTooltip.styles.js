import {StyleSheet} from 'react-native';

const createStyles = palette => StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 12,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: palette.modalOverlay,
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: palette.modalBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.modalBorder,
    maxWidth: 420,
    padding: 16,
    width: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: palette.modalHeaderText,
  },
  message: {
    color: palette.modalText,
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: palette.buttonBackground,
    borderColor: palette.buttonBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});

export default createStyles;

import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
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
  },
  message: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    color: '#0F172A',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    textAlign: 'right',
  },
});

export default styles;

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
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
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  secondaryButton: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#334155',
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
    opacity: 0.62,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default styles;

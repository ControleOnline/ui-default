import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(15,23,42,0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '78%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  modalHeader: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  searchBox: {
    padding: 10,
  },
  optionRow: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 18,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default styles;

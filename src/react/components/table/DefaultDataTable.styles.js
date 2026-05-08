import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    minWidth: '100%',
  },
  headerRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  cell: {
    minWidth: 118,
    width: 136,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#EEF2F7',
  },
  identityCell: {
    minWidth: 76,
    width: 84,
  },
  moneyCell: {
    minWidth: 128,
    width: 140,
  },
  headerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  sortableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cellText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  mutedCellText: {
    color: '#94A3B8',
  },
  editableCell: {
    backgroundColor: '#FFFFFF',
  },
  editingCell: {
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
  },
  editingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
  },
  savingText: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionsCell: {
    minWidth: 60,
    width: 64,
    alignItems: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default styles;

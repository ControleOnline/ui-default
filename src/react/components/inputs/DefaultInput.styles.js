import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minWidth: 0,
  },
  readButton: {
    minHeight: 28,
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readButtonForm: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  readText: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  mutedText: {
    color: '#94A3B8',
  },
  editIcon: {
    flexShrink: 0,
  },
  fieldLabel: {
    marginBottom: 4,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  editingWrap: {
    width: '100%',
    minWidth: 0,
  },
  editingRow: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    minWidth: 0,
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
  formInput: {
    height: 34,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
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
  savingText: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

export default styles;

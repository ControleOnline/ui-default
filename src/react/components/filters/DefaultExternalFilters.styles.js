import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  field: {
    minWidth: 136,
    flexGrow: 1,
    flexBasis: 160,
  },
  inputWrap: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 20,
    padding: 0,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  clearButton: {
    height: 40,
    minWidth: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});

export default styles;

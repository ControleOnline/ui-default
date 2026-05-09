import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrap: {
    minHeight: 40,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wrapCompact: {
    minHeight: 30,
    minWidth: 150,
    maxWidth: 240,
    borderRadius: 15,
    paddingLeft: 9,
    paddingRight: 3,
    paddingVertical: 3,
    gap: 6,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  inputCompact: {
    fontSize: 12,
    lineHeight: 14,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconButtonCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  searchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchButtonCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

export default styles;

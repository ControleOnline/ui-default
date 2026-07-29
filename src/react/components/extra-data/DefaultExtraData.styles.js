import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  item: {
    maxWidth: 180,
    minHeight: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  key: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 1,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  more: {
    alignSelf: 'center',
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  empty: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
})

export default styles

import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  wrap: {
    minWidth: 0,
    width: '100%',
  },
  list: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 28,
    minWidth: 0,
  },
  item: {
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 26,
    maxWidth: 132,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imageItem: {
    borderRadius: 6,
    height: 32,
    paddingHorizontal: 2,
    paddingVertical: 2,
    width: 42,
  },
  image: {
    borderRadius: 4,
    height: 28,
    width: 38,
  },
  label: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 92,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default styles;

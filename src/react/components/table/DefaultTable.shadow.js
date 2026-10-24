import {Platform} from 'react-native';
export const shadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  android: { elevation: 6 },
  web: { boxShadow: '0 14px 36px rgba(15,23,42,0.16)' },
});

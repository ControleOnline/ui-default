import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useStore } from '@store';
import DefaultTableCards from './DefaultTableCards';
import DefaultTableRows from './DefaultTableRows';
import { DEFAULT_COMPACT_BREAKPOINT } from './DefaultTable.utils';
import styles from './DefaultTable.styles';

const DefaultTableBody = ({ storeName }) => {
  const store = useStore(storeName);
  const { width } = useWindowDimensions();
  const configs = store?.getters?.configs || {};
  const compactBreakpoint = Number(configs.compactBreakpoint || DEFAULT_COMPACT_BREAKPOINT);
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const effectiveViewMode =
    configs.effectiveViewMode ||
    configs.viewMode ||
    (isCompactView && configs.forceCardsOnCompact !== false ? 'cards' : null) ||
    configs.initialViewMode ||
    'table';

  return (
    <View style={styles.body}>
      {effectiveViewMode === 'cards'
        ? <DefaultTableCards storeName={storeName} />
        : <DefaultTableRows storeName={storeName} />}
    </View>
  );
};

export default DefaultTableBody;

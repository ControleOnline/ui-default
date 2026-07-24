import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useStore } from '@store';
import DefaultTableCards from './DefaultTableCards';
import DefaultTableRows from './DefaultTableRows';
import { DEFAULT_COMPACT_BREAKPOINT } from './DefaultTable.utils';

const DefaultTableBody = ({ storeName }) => {
  const store = useStore(storeName);
  const { width } = useWindowDimensions();
  const configs = store?.getters?.configs || {};
  const compactBreakpoint = Number(configs.compactBreakpoint || DEFAULT_COMPACT_BREAKPOINT);
  const isCompactView = width > 0 && width <= compactBreakpoint;
  const effectiveViewMode = isCompactView && configs.forceCardsOnCompact !== false
    ? 'cards'
    : configs.viewMode || configs.initialViewMode || 'table';

  return effectiveViewMode === 'cards'
    ? <DefaultTableCards storeName={storeName} />
    : <DefaultTableRows storeName={storeName} />;
};

export default DefaultTableBody;

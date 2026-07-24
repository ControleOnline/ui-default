import React from 'react';
import DefaultTableCards from './DefaultTableCards';
import DefaultTableRows from './DefaultTableRows';
import { getDefaultTableRuntime } from './DefaultTable.runtime';

const DefaultTableBody = ({ storeName }) => {
  const { effectiveViewMode = 'table' } = getDefaultTableRuntime(storeName).body || {};

  return effectiveViewMode === 'cards'
    ? <DefaultTableCards storeName={storeName} />
    : <DefaultTableRows storeName={storeName} />;
};

export default DefaultTableBody;

import React from 'react';
import { View } from 'react-native';
import StateStore from '@controleonline/ui-common/src/react/components/StateStore';
import styles from './DefaultTable.styles';

const DefaultTableLoadingOverlay = ({
  isLoading,
  itemCount,
  tableBorderColor,
  tableSurfaceColor,
}) => {
  if (!isLoading || itemCount === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.loadingOverlay}>
      <View
        style={[
          styles.loadingOverlayCard,
          { borderColor: tableBorderColor, backgroundColor: tableSurfaceColor },
        ]}
      >
        <StateStore compact loading="Carregando mais registros..." />
      </View>
    </View>
  );
};

export default DefaultTableLoadingOverlay;

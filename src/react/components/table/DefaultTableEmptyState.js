import React from 'react';
import { Text, View } from 'react-native';
import StateStore from '@controleonline/ui-common/src/react/components/StateStore';
import styles from './DefaultTable.styles';

const DefaultTableEmptyState = ({
  emptyStateLabel,
  isLoading,
  isTable = false,
  tableLayoutStyle = null,
  tableMutedColor,
}) => (
  <View style={[styles.emptyBox, isTable ? tableLayoutStyle : null]}>
    {isLoading ? (
      <StateStore compact loading={emptyStateLabel} />
    ) : (
      <Text style={[styles.emptyText, { color: tableMutedColor }]}>{emptyStateLabel}</Text>
    )}
  </View>
);

export default DefaultTableEmptyState;

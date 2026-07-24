import React from 'react';
import { View } from 'react-native';
import DefaultInput from '../inputs/DefaultInput';
import { getColumnKey, isEditableColumn } from '../inputs/defaultInputUtils';
import { getColumnStyle } from './DefaultTable.utils';
import { getDefaultTableRuntime } from './DefaultTable.runtime';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const DefaultTableInput = ({
  column: columnProp = null,
  fieldName = '',
  options = {},
  row = {},
  storeName = '',
  variant = 'cell',
}) => {
  const {
    columns = [],
    getOptionsForColumn,
    hasRowPress = false,
    loadListOptionsForColumns,
    onCancelEditing,
    onSaveCell,
    onStartEditing,
  } = getDefaultTableRuntime(storeName).input || {};
  const { resolvedAccentColor } = useDefaultTableTheme();
  const column = columnProp || columns.find(item => getColumnKey(item) === fieldName);

  if (!column) return null;

  const resolvedFieldName = getColumnKey(column);
  const cellKey = `${row?.id || row?.['@id']}:${resolvedFieldName}`;
  const editingCell = getDefaultTableRuntime(storeName).input?.editingCell;
  const savingCell = getDefaultTableRuntime(storeName).input?.savingCell;
  const isEditing = editingCell === cellKey;
  const isSaving = savingCell === cellKey;
  const input = (
    <DefaultInput
      accentColor={options.accentColor || resolvedAccentColor}
      column={column}
      columns={columns}
      containerStyle={options.containerStyle}
      displayValue={options.displayValue}
      editing={isEditing}
      getOptionsForColumn={getOptionsForColumn}
      inputStyle={options.inputStyle}
      label={options.label}
      numberOfLines={options.numberOfLines}
      onBeforeOpen={() => loadListOptionsForColumns?.([column])}
      onCancelEditing={onCancelEditing}
      onSave={value => onSaveCell?.(row, column, value)}
      onSearchChange={value => loadListOptionsForColumns?.([column], value)}
      onStartEditing={() => onStartEditing?.(row, column)}
      readTextStyle={options.readTextStyle || options.textStyle}
      row={row}
      saving={isSaving}
      showLabel={options.showLabel}
      storeName={storeName}
      variant={options.variant || variant}
    />
  );

  if (variant !== 'cell') {
    return input;
  }

  const shouldDelegatePress = hasRowPress && !isEditableColumn(column);

  return (
    <View
      style={[getColumnStyle(column), isEditing ? styles.editingCell : null]}
      pointerEvents={shouldDelegatePress ? 'none' : 'auto'}
    >
      {input}
    </View>
  );
};

export default DefaultTableInput;

import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '@store';
import DefaultInput from '../inputs/DefaultInput';
import {
  formatSaveValue,
  getColumnKey,
  isEditableColumn,
  normalizeId,
} from '../inputs/defaultInputUtils';
import { getColumnStyle } from './DefaultTable.utils';
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
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];
  const hasRowPress = false;
  const { resolvedAccentColor } = useDefaultTableTheme();
  const column = columnProp || columns.find(item => getColumnKey(item) === fieldName);

  if (!column) return null;

  const resolvedFieldName = getColumnKey(column);
  const input = (
    <DefaultInput
      accentColor={options.accentColor || resolvedAccentColor}
      column={column}
      columns={columns}
      containerStyle={options.containerStyle}
      displayValue={options.displayValue}
      editing={isEditing}
      getOptionsForColumn={configs.getOptionsForColumn}
      inputStyle={options.inputStyle}
      label={options.label}
      numberOfLines={options.numberOfLines}
      onCancelEditing={() => setIsEditing(false)}
      onSave={value => {
        if (typeof store?.actions?.save !== 'function') {
          setIsEditing(false);
          return Promise.resolve(null);
        }

        setIsSaving(true);
        return Promise.resolve(
          store.actions.save({
            id: normalizeId(row?.['@id'] || row?.id),
            [resolvedFieldName]: formatSaveValue(column, value, row),
          }),
        )
          .then(savedItem => {
            configs.onSaved?.(savedItem, row);
            return savedItem;
          })
          .finally(() => {
          setIsSaving(false);
          setIsEditing(false);
        });
      }}
      onStartEditing={() => setIsEditing(true)}
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

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

const STORE_ACTION_META_KEY = '__storeMeta';

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const buildSavedItemPatch = (column, fieldName, value) => {
  if (!column?.list || !fieldName || !isPlainObject(value)) {
    return {};
  }

  if (isPlainObject(value.object)) {
    return {
      [fieldName]: value.object,
    };
  }

  if (value.value == null && value.label == null) {
    return {};
  }

  const labelField = column?.listSearchParam || column?.searchParam || fieldName;

  return {
    [fieldName]: {
      id: value.value,
      value: value.value,
      label: value.label,
      [labelField]: value.label,
    },
  };
};

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
        const savedItemPatch = buildSavedItemPatch(column, resolvedFieldName, value);
        const storeMeta =
          Object.keys(savedItemPatch).length > 0
            ? {
                [STORE_ACTION_META_KEY]: {
                  savedItemPatch,
                },
              }
            : {};

        return Promise.resolve(
          store.actions.save({
            id: normalizeId(row?.['@id'] || row?.id),
            [resolvedFieldName]: formatSaveValue(column, value, row),
            ...storeMeta,
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
      style={[getColumnStyle(column), options.cellStyle, isEditing ? styles.editingCell : null]}
      pointerEvents={shouldDelegatePress ? 'none' : 'auto'}
    >
      {input}
    </View>
  );
};

export default DefaultTableInput;

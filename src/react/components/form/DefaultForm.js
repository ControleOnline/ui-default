import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatStoreColumnLabel } from '@controleonline/ui-common/src/react/utils/storeColumns';
import DefaultInput from '../inputs/DefaultInput';
import {
  formatSaveValue,
  getColumnKey,
  isEditableColumn,
  normalizeId,
  normalizeText,
  resolveEditValue,
} from '../inputs/defaultInputUtils';
import styles from './DefaultForm.styles';

const hasValue = value => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value === 'object') {
    return normalizeText(value.value ?? value.id ?? value['@id'] ?? '') !== '';
  }

  return normalizeText(value) !== '';
};

const resolveDefaultValue = (column, row) => {
  const fieldName = getColumnKey(column);
  if (row && row[fieldName] !== undefined) return row[fieldName];
  if (typeof column?.defaultValue === 'function') return column.defaultValue(row, column);
  if (column?.defaultValue !== undefined) return column.defaultValue;
  if (typeof column?.initialValue === 'function') return column.initialValue(row, column);
  if (column?.initialValue !== undefined) return column.initialValue;
  return undefined;
};

const shouldIncludeColumn = (column, row, mode) => {
  const fieldName = getColumnKey(column);
  if (!fieldName || column?.isIdentity === true) return false;
  if (column?.form === false || column?.multiline === true) return false;
  if (mode === 'create' && column?.add === false) return false;
  if (mode !== 'create' && !isEditableColumn(column)) return false;
  if (typeof column?.visibleForm === 'function') {
    return column.visibleForm(row, column) !== false;
  }

  return column?.visibleForm !== false;
};

const buildDraft = (columns, row) =>
  columns.reduce((draft, column) => {
    const fieldName = getColumnKey(column);
    const defaultValue = resolveDefaultValue(column, row);
    draft[fieldName] = resolveEditValue(column, row, defaultValue);
    return draft;
  }, {});

const DefaultForm = ({
  accentColor = '#2563EB',
  actions = {},
  columns = [],
  getOptionsForColumn = null,
  mode = 'edit',
  onCancel = null,
  onSaved = null,
  row = {},
  storeName = '',
}) => {
  const formColumns = useMemo(
    () => columns.filter(column => shouldIncludeColumn(column, row, mode)),
    [columns, mode, row],
  );
  const [draft, setDraft] = useState(() => buildDraft(formColumns, row));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(buildDraft(formColumns, row));
  }, [formColumns, row]);

  const save = useCallback(() => {
    if (typeof actions.save !== 'function') {
      onCancel?.();
      return Promise.resolve(null);
    }

    const isCreate = mode === 'create';
    const payload = isCreate
      ? {}
      : { id: normalizeId(row?.['@id'] || row?.id) };

    formColumns.forEach(column => {
      const fieldName = getColumnKey(column);
      const nextValue = draft[fieldName];

      if (isCreate) {
        if (hasValue(nextValue)) {
          payload[fieldName] = formatSaveValue(column, nextValue, row);
        }
        return;
      }

      const currentValue = resolveEditValue(column, row);
      if (normalizeText(currentValue) !== normalizeText(nextValue)) {
        payload[fieldName] = formatSaveValue(column, nextValue, row);
      }
    });

    const payloadKeys = Object.keys(payload);
    if ((isCreate && payloadKeys.length === 0) || (!isCreate && payloadKeys.length <= 1)) {
      onCancel?.();
      return Promise.resolve(null);
    }

    setIsSaving(true);

    return actions.save(payload)
      .then(savedItem => {
        onSaved?.(savedItem || { ...row, ...draft }, row);
        return savedItem;
      })
      .catch(error => {
        console.error(error);
        return null;
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [actions, draft, formColumns, mode, onCancel, onSaved, row]);

  return (
    <>
      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {formColumns.length > 0 ? (
          <View style={styles.formGrid}>
            {formColumns.map(column => {
              const fieldName = getColumnKey(column);
              const label = formatStoreColumnLabel({
                columns,
                fieldName,
                fallbackLabel: column?.label || fieldName,
                storeName,
              });

              return (
                <View key={fieldName} style={styles.formField}>
                  <DefaultInput
                    accentColor={accentColor}
                    autoFocus={false}
                    autoSave={false}
                    column={column}
                    columns={columns}
                    editing
                    getOptionsForColumn={getOptionsForColumn}
                    label={label}
                    onChangeValue={value => setDraft(prev => ({ ...prev, [fieldName]: value }))}
                    row={row}
                    showLabel
                    storeName={storeName}
                    value={draft[fieldName]}
                    variant="form"
                  />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {global.t?.t(storeName, 'label', 'no_fields') || 'Nenhum campo disponivel'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>
            {global.t?.t(storeName, 'button', 'cancel') || 'Cancelar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: accentColor },
            isSaving ? styles.primaryButtonDisabled : null,
          ]}
          activeOpacity={0.86}
          disabled={isSaving}
          onPress={save}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? 'Salvando' : global.t?.t(storeName, 'button', 'save') || 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default DefaultForm;

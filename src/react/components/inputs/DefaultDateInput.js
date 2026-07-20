import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Formatter from '@controleonline/ui-common/src/utils/formatter.js';
import {
  getColumnKey,
  isEditableColumn,
  normalizeText,
  resolveCellText,
  resolveEditValue,
} from './defaultInputUtils';
import styles from './DefaultInput.styles';

const normalizeDateDraft = value => {
  const text = normalizeText(value);
  if (!text) return '';

  return Formatter.formatDateToBR(text);
};

const DefaultDateInput = ({
  accentColor = '#2563EB',
  autoFocus = true,
  autoSave = true,
  column,
  columns = [],
  containerStyle = null,
  displayValue,
  editing = false,
  inputStyle = null,
  label = '',
  numberOfLines = 1,
  onCancelEditing = null,
  onChangeValue = null,
  onSave = null,
  onStartEditing = null,
  readTextStyle = null,
  row = {},
  saving = false,
  showLabel = false,
  storeName = '',
  value,
  variant = 'cell',
}) => {
  const fieldName = getColumnKey(column);
  const isForm = variant === 'form';
  const canEdit = isEditableColumn(column) && typeof onStartEditing === 'function';
  const editValue = useMemo(
    () => normalizeDateDraft(value ?? resolveEditValue(column, row)),
    [column, row, value],
  );
  const [draftValue, setDraftValue] = useState(editValue);
  const [validationMessage, setValidationMessage] = useState('');
  const resolvedLabel =
    displayValue ?? resolveCellText({ column, columns, row, storeName, value });

  useEffect(() => {
    setDraftValue(editValue);
    setValidationMessage('');
  }, [editValue, editing]);

  const saveDraft = () => {
    const validationResult = Formatter.validateBRDate(draftValue);

    if (validationResult !== true) {
      setValidationMessage(validationResult);
      return;
    }

    setValidationMessage('');

    if (autoSave) {
      onSave?.(draftValue);
      return;
    }

    onChangeValue?.(draftValue);
  };

  const updateDraft = nextValue => {
    setDraftValue(nextValue);
    if (validationMessage) setValidationMessage('');
    if (!autoSave) onChangeValue?.(nextValue);
  };

  if (!editing && !isForm) {
    return (
      <View style={[styles.wrap, containerStyle]}>
        {showLabel ? <Text style={styles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}
        <TouchableOpacity
          style={styles.readButton}
          activeOpacity={canEdit ? 0.78 : 1}
          disabled={!canEdit}
          onPress={() => onStartEditing?.()}
        >
          <Text
            style={[
              styles.readText,
              resolvedLabel === '-' ? styles.mutedText : null,
              readTextStyle,
            ]}
            numberOfLines={numberOfLines}
          >
            {resolvedLabel || '-'}
          </Text>
          {saving ? (
            <Text style={[styles.savingText, { color: accentColor }]}>Salvando</Text>
          ) : canEdit ? (
            <Icon style={styles.editIcon} name="calendar" size={13} color="#64748B" />
          ) : null}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, containerStyle]}>
      {showLabel ? <Text style={styles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}
      <View style={styles.editingWrap}>
        <View style={styles.editingRow}>
          <TextInput
            style={[
              styles.input,
              isForm ? styles.formInput : null,
              inputStyle,
            ]}
            value={draftValue}
            keyboardType="numeric"
            placeholder="DD/MM/YYYY"
            onBlur={autoSave ? saveDraft : undefined}
            onChangeText={updateDraft}
            onSubmitEditing={saveDraft}
            autoFocus={autoFocus && !isForm}
            selectTextOnFocus
          />
          <Icon name="calendar" size={15} color="#64748B" />
          {!isForm ? (
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={onCancelEditing}>
              <Icon name="x" size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
        {!!validationMessage && <Text style={styles.validationText}>{validationMessage}</Text>}
        {saving ? <Text style={styles.savingText}>Salvando</Text> : null}
      </View>
    </View>
  );
};

export default DefaultDateInput;

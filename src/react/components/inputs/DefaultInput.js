import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  getColumnKey,
  isEditableColumn,
  normalizeText,
  resolveCellText,
  resolveEditValue,
} from './defaultInputUtils';
import DefaultSelect from './DefaultSelect';
import styles from './DefaultInput.styles';

const DefaultInput = ({
  accentColor = '#2563EB',
  autoFocus = true,
  autoSave = true,
  column,
  columns = [],
  containerStyle = null,
  displayValue,
  editing = false,
  getOptionsForColumn = null,
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
    () => normalizeText(value ?? resolveEditValue(column, row)),
    [column, row, value],
  );
  const [draftValue, setDraftValue] = useState(editValue);
  const resolvedLabel =
    displayValue ?? resolveCellText({ column, columns, row, storeName, value });

  useEffect(() => {
    setDraftValue(editValue);
  }, [editValue, editing]);

  if (column?.list) {
    return (
      <DefaultSelect
        accentColor={accentColor}
        autoSave={autoSave}
        column={column}
        columns={columns}
        containerStyle={containerStyle}
        displayValue={displayValue}
        editing={editing}
        getOptionsForColumn={getOptionsForColumn}
        label={label}
        numberOfLines={numberOfLines}
        onCancelEditing={onCancelEditing}
        onChangeValue={onChangeValue}
        onSave={onSave}
        onStartEditing={onStartEditing}
        readTextStyle={readTextStyle}
        row={row}
        saving={saving}
        showLabel={showLabel}
        storeName={storeName}
        value={value}
        variant={variant}
      />
    );
  }

  const saveDraft = () => {
    if (autoSave) {
      onSave?.(draftValue);
      return;
    }

    onChangeValue?.(draftValue);
  };

  const updateDraft = nextValue => {
    setDraftValue(nextValue);
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
            {column?.prefix || ''}
            {resolvedLabel || '-'}
            {column?.sufix || column?.suffix || ''}
          </Text>
          {saving ? (
            <Text style={[styles.savingText, { color: accentColor }]}>Salvando</Text>
          ) : canEdit ? (
            <Icon style={styles.editIcon} name="edit-2" size={13} color="#64748B" />
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
            keyboardType={column?.inputType === 'number' || column?.inputType === 'float' ? 'numeric' : 'default'}
            placeholder={global.t?.t(storeName, 'input', column?.label || fieldName)}
            onBlur={autoSave ? saveDraft : undefined}
            onChangeText={updateDraft}
            onSubmitEditing={saveDraft}
            autoFocus={autoFocus && !isForm}
            selectTextOnFocus
          />
          {!isForm ? (
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={onCancelEditing}>
              <Icon name="x" size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
        {saving ? <Text style={styles.savingText}>Salvando</Text> : null}
      </View>
    </View>
  );
};

export default DefaultInput;

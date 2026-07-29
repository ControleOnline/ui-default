import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/Feather';
import {
  getColumnKey,
  normalizeText,
  resolveColorToken,
  resolveDefaultColorValue,
} from './defaultInputUtils';
import styles from './DefaultInput.styles';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const normalizeColorText = value => {
  const normalized = normalizeText(value);
  if (!normalized) return '';

  return normalized.startsWith('#') || normalized.startsWith('$')
    ? normalized
    : `#${normalized}`;
};

const isValidHexColor = value => HEX_COLOR_REGEX.test(resolveColorToken(value));

const DefaultColorInput = ({
  accentColor = '#2563EB',
  autoFocus = true,
  autoSave = true,
  column,
  containerStyle = null,
  defaultColor: defaultColorProp = '',
  editing = false,
  inputStyle = null,
  label = '',
  onCancelEditing = null,
  onChangeValue = null,
  onSave = null,
  onStartEditing = null,
  row = {},
  saving = false,
  showLabel = false,
  value,
  variant = 'cell',
}) => {
  const themeColors = useStore('theme')?.getters?.colors || {};
  const fieldName = getColumnKey(column);
  const rawValue = value ?? row?.[fieldName];
  const defaultColor = useMemo(
    () => resolveDefaultColorValue(column, themeColors, defaultColorProp),
    [column, defaultColorProp, themeColors],
  );
  const readValue = normalizeColorText(rawValue) || defaultColor || '#CBD5E1';
  const previewColor = resolveColorToken(readValue, themeColors) || defaultColor || '#CBD5E1';
  const [draftValue, setDraftValue] = useState(readValue);
  const isForm = variant === 'form';

  useEffect(() => {
    setDraftValue(readValue);
  }, [readValue, editing]);

  const saveDraft = () => {
    const nextValue = normalizeColorText(draftValue) || defaultColor || '#CBD5E1';
    if (autoSave) {
      onSave?.(nextValue);
      return;
    }

    onChangeValue?.(nextValue);
  };

  const updateDraft = nextValue => {
    setDraftValue(nextValue);
    if (!autoSave) onChangeValue?.(normalizeColorText(nextValue));
  };

  const applyDefaultColor = () => {
    if (!defaultColor) return;
    setDraftValue(defaultColor);
    if (!autoSave) onChangeValue?.(defaultColor);
  };

  if (!editing && !isForm) {
    return (
      <View style={[styles.wrap, containerStyle]}>
        {showLabel ? <Text style={styles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}
        <TouchableOpacity
          style={styles.readButton}
          activeOpacity={0.78}
          disabled={typeof onStartEditing !== 'function'}
          onPress={() => onStartEditing?.()}
        >
          <View style={[styles.colorPreview, { backgroundColor: previewColor }]} />
          <Text style={styles.readText} numberOfLines={1}>
            {readValue}
          </Text>
          {saving ? (
            <Text style={[styles.savingText, { color: accentColor }]}>Salvando</Text>
          ) : (
            <Icon style={styles.editIcon} name="edit-2" size={13} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, containerStyle]}>
      {showLabel ? <Text style={styles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}
      <View style={styles.editingWrap}>
        <View style={styles.editingRow}>
          <View style={[styles.colorPreview, { backgroundColor: resolveColorToken(draftValue, themeColors) || previewColor }]} />
          <TextInput
            autoCapitalize="characters"
            autoFocus={autoFocus && !isForm}
            onBlur={autoSave ? saveDraft : undefined}
            onChangeText={updateDraft}
            onSubmitEditing={saveDraft}
            placeholder={defaultColor || '#CBD5E1'}
            placeholderTextColor="#CBD5E1"
            selectTextOnFocus
            style={[
              styles.input,
              styles.colorInput,
              isForm ? styles.formInput : null,
              isValidHexColor(draftValue) ? null : styles.invalidColorInput,
              inputStyle,
            ]}
            value={draftValue}
          />
          {defaultColor ? (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={applyDefaultColor}
              style={styles.colorDefaultButton}
            >
              <Icon name="rotate-ccw" size={13} color="#64748B" />
            </TouchableOpacity>
          ) : null}
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

export default DefaultColorInput;

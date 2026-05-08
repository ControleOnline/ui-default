import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  buildOptionsFromColumn,
  getColumnKey,
  normalizeOptionKey,
  normalizeText,
  resolveCellText,
  resolveEditValue,
} from './defaultInputUtils';
import styles from './DefaultInput.styles';

const DefaultSelect = ({
  accentColor = '#2563EB',
  autoSave = true,
  column,
  columns = [],
  containerStyle = null,
  displayValue,
  editing = false,
  getOptionsForColumn = null,
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fieldName = getColumnKey(column);
  const selectedKey = normalizeOptionKey(value ?? resolveEditValue(column, row));
  const options = useMemo(
    () => buildOptionsFromColumn(column, getOptionsForColumn),
    [column, getOptionsForColumn],
  );
  const selected = options.find(option => option.key === selectedKey);
  const resolvedLabel =
    displayValue ??
    selected?.label ??
    resolveCellText({ column, columns, row, storeName, value });
  const canEdit = column?.editable !== false && typeof onStartEditing === 'function';
  const isForm = variant === 'form';
  const filteredOptions = useMemo(() => {
    const query = normalizeText(searchText).toLowerCase();
    if (!query) return options;
    return options.filter(option =>
      normalizeText(option.label).toLowerCase().includes(query) ||
      normalizeText(option.key).toLowerCase().includes(query),
    );
  }, [options, searchText]);

  useEffect(() => {
    if (editing && autoSave) setIsOpen(true);
  }, [autoSave, editing]);

  const close = () => {
    setIsOpen(false);
    setSearchText('');
    if (autoSave) onCancelEditing?.();
  };

  const selectOption = option => {
    setIsOpen(false);
    setSearchText('');

    if (autoSave) {
      onSave?.({
        value: option.key,
        label: option.label,
        object: option.raw,
      });
      return;
    }

    onChangeValue?.(option.key, {
      value: option.key,
      label: option.label,
      object: option.raw,
    });
  };

  const open = () => {
    if (!editing && !isForm) onStartEditing?.();
    setIsOpen(true);
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      {showLabel ? <Text style={styles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}

      <TouchableOpacity
        style={[styles.readButton, isForm ? styles.readButtonForm : null]}
        activeOpacity={canEdit || isForm ? 0.78 : 1}
        disabled={!canEdit && !isForm}
        onPress={open}
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
        ) : canEdit || isForm ? (
          <Icon style={styles.editIcon} name="chevron-down" size={14} color="#64748B" />
        ) : null}
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backgroundColor: 'rgba(15,23,42,0.38)',
        }}>
          <View style={{
            width: '100%',
            maxWidth: 420,
            maxHeight: '78%',
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}>
            <View style={{
              minHeight: 48,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <Text style={{ flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
                {label || column?.label || fieldName}
              </Text>
              <TouchableOpacity style={styles.cancelButton} onPress={close}>
                <Icon name="x" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 10 }}>
              <TextInput
                style={[styles.input, styles.formInput]}
                value={searchText}
                placeholder={global.t?.t(storeName, 'input', column?.searchParam || 'search') || 'Buscar'}
                onChangeText={setSearchText}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => {
                  const isSelected = option.key === selectedKey;
                  return (
                    <TouchableOpacity
                      key={`${option.key}_${option.label}`}
                      style={{
                        minHeight: 40,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderTopWidth: 1,
                        borderTopColor: '#F1F5F9',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      activeOpacity={0.78}
                      onPress={() => selectOption(option)}
                    >
                      <Icon
                        name={isSelected ? 'check-circle' : 'circle'}
                        size={15}
                        color={isSelected ? accentColor : '#CBD5E1'}
                      />
                      <Text style={{ flex: 1, color: '#0F172A', fontSize: 13, fontWeight: '700' }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ padding: 18, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '700' }}>
                    Nenhum resultado encontrado
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DefaultSelect;

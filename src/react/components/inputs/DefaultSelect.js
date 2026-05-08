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
  isEditableColumn,
  normalizeOptionKey,
  normalizeText,
  resolveCellText,
  resolveEditValue,
} from './defaultInputUtils';
import inputStyles from './DefaultInput.styles';
import styles from './DefaultSelect.styles';

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
  const canEdit = isEditableColumn(column) && typeof onStartEditing === 'function';
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
    if (!canEdit && !isForm) return;
    if (!editing && !isForm) onStartEditing?.();
    setIsOpen(true);
  };

  return (
    <View style={[inputStyles.wrap, containerStyle]}>
      {showLabel ? <Text style={inputStyles.fieldLabel}>{label || column?.label || fieldName}</Text> : null}

      <TouchableOpacity
        style={[inputStyles.readButton, isForm ? inputStyles.readButtonForm : null]}
        activeOpacity={canEdit || isForm ? 0.78 : 1}
        disabled={!canEdit && !isForm}
        onPress={open}
      >
        <Text
          style={[
            inputStyles.readText,
            resolvedLabel === '-' ? inputStyles.mutedText : null,
            readTextStyle,
          ]}
          numberOfLines={numberOfLines}
        >
          {resolvedLabel || '-'}
        </Text>
        {saving ? (
          <Text style={[inputStyles.savingText, { color: accentColor }]}>Salvando</Text>
        ) : canEdit || isForm ? (
          <Icon style={inputStyles.editIcon} name="chevron-down" size={14} color="#64748B" />
        ) : null}
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {label || column?.label || fieldName}
              </Text>
              <TouchableOpacity style={inputStyles.cancelButton} onPress={close}>
                <Icon name="x" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                style={[inputStyles.input, inputStyles.formInput]}
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
                      style={styles.optionRow}
                      activeOpacity={0.78}
                      onPress={() => selectOption(option)}
                    >
                      <Icon
                        name={isSelected ? 'check-circle' : 'circle'}
                        size={15}
                        color={isSelected ? accentColor : '#CBD5E1'}
                      />
                      <Text style={styles.optionText}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
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

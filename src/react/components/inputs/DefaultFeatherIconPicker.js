import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FeatherGlyphMap from 'react-native-vector-icons/glyphmaps/Feather.json';
import styles from './DefaultFeatherIconPicker.styles';

export const FEATHER_ICON_OPTIONS = Object.keys(FeatherGlyphMap)
  .sort((left, right) => left.localeCompare(right))
  .map(name => ({
    id: name,
    icon: name,
    label: name,
  }));

export const isValidFeatherIconName = value =>
  Boolean(FeatherGlyphMap[String(value || '').trim()]);

export const normalizeFeatherIconName = value => {
  const icon = String(value || '').trim();
  return isValidFeatherIconName(icon) ? icon : '';
};

const DefaultFeatherIconPicker = ({
  accessibilityLabel = 'Selecionar icone',
  modalTitle = 'Selecionar icone',
  onChange,
  placeholder = 'Buscar icone',
  style,
  value,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedIcon = normalizeFeatherIconName(value);
  const hasPreview = Boolean(selectedIcon);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return FEATHER_ICON_OPTIONS;

    return FEATHER_ICON_OPTIONS.filter(option =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const selectIcon = icon => {
    onChange?.(icon);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.82}
        style={[styles.field, style]}
        onPress={() => setOpen(true)}
      >
        <View style={styles.valueWrap}>
          <Icon
            name={hasPreview ? selectedIcon : 'search'}
            size={17}
            color={hasPreview ? '#0F172A' : '#64748B'}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.valueText,
              !hasPreview && styles.placeholderText,
            ]}
          >
            {selectedIcon || placeholder}
          </Text>
        </View>
        <Icon name="chevron-down" size={14} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
                <Icon name="x" size={18} color="#334155" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Filtrar"
              placeholderTextColor="#94A3B8"
            />
            <ScrollView contentContainerStyle={styles.options}>
              {filteredOptions.map(option => {
                const selected = option.id === selectedIcon;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionRow,
                      selected && styles.optionRowActive,
                    ]}
                    onPress={() => selectIcon(option.id)}
                  >
                    <View style={styles.optionGlyph}>
                      <Icon
                        name={option.icon}
                        size={18}
                        color={selected ? '#1D4ED8' : '#334155'}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.optionText,
                        selected && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DefaultFeatherIconPicker;

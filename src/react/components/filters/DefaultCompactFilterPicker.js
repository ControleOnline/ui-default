import React from 'react';
import {Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DefaultCompactDialog from '../table/DefaultCompactDialog';
import useDefaultTableTheme from '../table/useDefaultTableTheme';

// Presentation only: loading, scoped options and date validation stay in the existing selector.
export default function DefaultCompactFilterPicker({visible, disabled, label, title, selectedKey, options, searchText, searchable, onSearch, onOpen, onClose, onSelect, children}) {
  const {themeColors: c} = useDefaultTableTheme();
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Selecionar ${title}`} accessibilityState={{expanded: visible, disabled}}
      disabled={disabled} onPress={onOpen} style={[s.trigger, {borderColor: c.inputBorder, backgroundColor: c.inputBackground}]}>
      <Text numberOfLines={1} style={{flex: 1, color: c.inputText, fontSize: 14}}>{label || 'Todos'}</Text><Icon name="chevron-down" size={17} color={c.textSecondary} />
    </TouchableOpacity>
    <DefaultCompactDialog visible={visible} title={title} onClose={onClose} bodyHeight={Math.min(460, 40 + options.length * 48 + (searchable ? 60 : 0) + (children ? 220 : 0))}>
      {searchable ? <TextInput accessibilityLabel={`Buscar em ${title}`} placeholder="Buscar opções" placeholderTextColor={c.inputPlaceholderText}
        value={searchText} onChangeText={onSearch} style={[s.search, {borderColor: c.inputBorder, color: c.inputText, backgroundColor: c.inputBackground}]} /> : null}
      {options.length === 0 ? <Text style={{color: c.textSecondary}}>Nenhuma opção encontrada.</Text> : null}
      {options.map(option => <TouchableOpacity key={option.key} accessibilityRole="radio" accessibilityLabel={option.label || 'Todos'} accessibilityState={{selected: option.key === selectedKey}}
        onPress={() => onSelect(option.key)} style={[s.option, {backgroundColor: option.key === selectedKey ? c.chipSelectedBackground : 'transparent', borderColor: c.tableRowBorder}]}>
        {option.image ? <Image source={option.image} style={{width: 24, height: 24}} resizeMode="contain" /> : null}
        {option.color ? <View style={[s.dot, {backgroundColor: option.color}]} /> : null}
        <Text style={{flex: 1, color: c.textPrimary, fontSize: 14}}>{option.label || 'Todos'}</Text>
        {option.key === selectedKey ? <Icon name="check" size={17} color={c.primary} /> : null}
      </TouchableOpacity>)}
      {children}
    </DefaultCompactDialog>
  </>;
}
const s = StyleSheet.create({
  trigger: {minHeight: 46, width: '100%', borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8},
  search: {minHeight: 44, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 16},
  option: {minHeight: 46, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1},
  dot: {width: 9, height: 9, borderRadius: 5},
});

import React, {useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useStore} from '@store';
import {formatStoreColumnLabel} from '@controleonline/ui-common/src/react/utils/storeColumns';
import {getColumnKey} from '../inputs/defaultInputUtils';
import {getSortField, isSortableColumn} from './DefaultTable.utils';
import {persistTableFiltersPreference, persistTableViewModePreference} from '../../utils/tableVisibleColumnsPreferences';
import DefaultCompactDialog from './DefaultCompactDialog';
import DefaultFiltersModal from './DefaultFiltersModal';
import DefaultColumnMenu from './DefaultColumnMenu';
import DefaultDebug from './DefaultDebug';
import DefaultToolbarAction from './DefaultToolbarAction';
import useDefaultTableTheme from './useDefaultTableTheme';
import {getCompactColumnLabel, getCompactFilterLabel, isActiveTableFilter} from './DefaultTableCompact.helpers';
import s from './DefaultTableCompact.styles';

export default function DefaultTableCompactToolbar({storeName, actions = [], showControls = true}) {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const filters = store?.getters?.filters || {};
  const columns = store?.getters?.columns || [];
  const {themeColors: c} = useDefaultTableTheme();
  const {width} = useWindowDimensions();
  const mobile = width <= (configs.compactBreakpoint || 768);
  // Below 1000px the toolbar collapses to search + More options + add, regardless of device.
  const collapsed = mobile || width < 1000;
  const [modal, setModal] = useState('');
  const searchKey = configs.searchKey || 'search';
  const [draft, setDraft] = useState(String(filters[searchKey] || ''));
  useEffect(() => setDraft(String(filters[searchKey] || '')), [filters[searchKey]]);
  const entries = Object.entries(filters).filter(([, value]) => isActiveTableFilter(value));
  const text = c.defaultFilter_textPrimary || c.defaultFilter_text;
  const muted = c.defaultFilter_textSecondary || text;
  const panel = c.defaultFilter_panelBackground || c.defaultFilter_cardBackground || c.defaultFilter_appBackground;
  const border = c.defaultFilter_inputBorder || c.defaultFilter_cardBorder || c.defaultFilter_border;
  const apply = next => {
    persistTableFiltersPreference(configs.tablePreferenceScope, next);
    if (configs.onFilterChange) configs.onFilterChange(next);
    else store.actions?.setFilters?.(next);
  };
  const remove = key => {const next = {...filters}; delete next[key]; apply(next);};
  const submit = () => {const next = {...filters}; if (draft.trim()) next[searchKey] = draft.trim(); else delete next[searchKey]; apply(next);};
  const button = (label, icon, onPress, selected = false, primary = false) => (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress}
      style={[s.button, {backgroundColor: primary ? c.defaultFilter_buttonBackground : selected ? c.defaultFilter_chipSelectedBackground || panel : panel, borderColor: border}, !mobile && icon === 'sliders' ? {marginLeft: 'auto'} : null]}>
      <Icon name={icon} size={16} color={primary ? c.defaultFilter_buttonIcon || c.defaultFilter_buttonText : text} />
      {label && (!collapsed || width >= 360 && (label === 'Filtros' || primary)) ? <Text style={[s.label, {color: primary ? c.defaultFilter_buttonText : text}]}>{primary && collapsed ? 'Novo' : label}</Text> : null}
    </TouchableOpacity>
  );
  const mode = configs.effectiveViewMode || 'table';
  const setMode = value => {
    persistTableViewModePreference(configs.tablePreferenceScope, value);
    store.actions?.setConfigs?.({...configs, effectiveViewMode: value, viewMode: value});
  };
  const canAdd = configs.add !== false && (configs.add === true || store.getters?.add === true) && configs.onAdd;
  const buttonLabel = configs.addLabel || 'Novo pedido';
  const columnButton = () => button('Colunas', 'columns', () => setModal('columns'));
  const addButton = () => button(buttonLabel, 'plus', configs.onAdd, false, true);
  const sortColumn = columns.find(column => getSortField(column) === configs.resolvedSort?.field);
  const labelFor = column => getCompactColumnLabel(column, formatStoreColumnLabel({columns, fieldName: getColumnKey(column), fallbackLabel: column?.label || getColumnKey(column), storeName}));
  return (
    <View style={[s.toolbar, {backgroundColor: c.defaultFilter_toolbarBackground || panel, borderBottomColor: border}]}>
      <View style={[s.row, {gap: collapsed ? 6 : 8, flexWrap: 'nowrap'}]}>
        {configs.showSearch !== false ? <View style={[s.search, mobile && s.searchMobile, {borderColor: border, backgroundColor: c.defaultFilter_inputBackground || panel}]}>
          <Icon name="search" size={16} color={c.defaultFilter_inputIcon || muted} />
          <TextInput accessibilityLabel={configs.searchPlaceholder || 'Buscar'} placeholder={configs.searchPlaceholder || 'Buscar'} placeholderTextColor={c.defaultFilter_inputPlaceholderText || muted}
            value={draft} onChangeText={setDraft} onSubmitEditing={submit} returnKeyType="search" style={[s.input, mobile && s.inputMobile, {color: c.defaultFilter_inputText || text}]} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Pesquisar" onPress={submit} style={{padding: 4}}><Icon name="arrow-right" size={16} color={text} /></TouchableOpacity>
        </View> : null}
        {showControls ? <>
          {!collapsed ? button('Filtros', 'sliders', () => setModal('filters')) : null}
          {!collapsed ? <View style={s.mode}>{button('Tabela', 'list', () => setMode('table'), mode === 'table')}{button('Cards', 'grid', () => setMode('cards'), mode === 'cards')}</View> : null}
          {!collapsed ? columnButton() : null}
          {button('Mais opções', 'more-horizontal', () => setModal('more'))}
          {canAdd ? addButton() : null}
        </> : null}
      </View>
      {entries.length ? <View style={s.chips}>{entries.map(([key, value]) => {
        const column = columns.find(item => getColumnKey(item) === key);
        const options = column ? configs.getOptionsForColumn?.(column) || column.options || [] : [];
        const valueLabel = Array.isArray(options) ? (Array.isArray(value) ? value : [value]).map(item => options.find(option => String(option.value ?? option.key) === String(item))?.label || getCompactFilterLabel(item)).join(', ') : getCompactFilterLabel(value);
        const label = `${column ? labelFor(column) + ': ' : key === searchKey ? 'Busca: ' : key + ': '}${valueLabel}`;
        return <TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={`Remover filtro ${label}`} onPress={() => remove(key)} style={[s.chip, {borderColor: border, backgroundColor: c.defaultFilter_chipBackground || panel}]}>
          <Text numberOfLines={1} style={[s.small, {color: c.defaultFilter_chipText || text, flexShrink: 1}]}>{label}</Text><Icon name="x" size={12} color={text} />
        </TouchableOpacity>;
      })}<TouchableOpacity accessibilityRole="button" onPress={() => apply({})}><Text style={[s.small, {color: muted}]}>Limpar filtros</Text></TouchableOpacity></View> : null}
      <DefaultFiltersModal storeName={storeName} visible={modal === 'filters'} deferred onClose={() => setModal('')} />
      <DefaultColumnMenu storeName={storeName} visible={modal === 'columns'} onClose={() => setModal('')} />
      <DefaultCompactDialog visible={modal === 'more' || modal === 'sort'} title={modal === 'sort' ? 'Ordenação' : 'Mais opções'}
        description={modal === 'sort' ? 'Escolha a coluna. Toque novamente para inverter a ordem.' : undefined}
        onClose={() => setModal('')} bodyHeight={modal === 'sort' ? columns.filter(isSortableColumn).length * 54 + 32 : collapsed ? 400 : 236}>
        {modal === 'sort' ? columns.filter(isSortableColumn).map(column => <TouchableOpacity key={getColumnKey(column)} accessibilityRole="button"
          accessibilityLabel={`Ordenar por ${labelFor(column)}`} style={[s.option, {borderBottomWidth: 1, borderBottomColor: c.defaultFilter_tableRowBorder}]}
          onPress={() => {configs.requestSort?.(column); setModal('');}}>
          <Text style={{color: text, fontSize: 14}}>{labelFor(column)}</Text><Text style={{color: muted}}>{getSortField(column) === configs.resolvedSort?.field ? configs.resolvedSort.direction === 'asc' ? '↑' : '↓' : '↕'}</Text>
        </TouchableOpacity>) : <View style={{gap: 8}}>{showControls ? <DefaultToolbarAction action={{label: `Ordenar: ${sortColumn ? labelFor(sortColumn) : 'Ordenar'} ${configs.resolvedSort?.direction === 'asc' ? '↑' : '↓'}`, accessibilityLabel: 'Escolher ordenação', icon: 'arrow-down', onPress: () => setModal('sort'), color: text,
          style: {width: '100%', minHeight: 48, justifyContent: 'flex-start', paddingHorizontal: 12, borderWidth: 0, backgroundColor: c.defaultFilter_inputBackground}, labelStyle: {fontSize: 14}}} /> : null}{collapsed ? ['filters', 'table', 'cards'].map(key => <DefaultToolbarAction key={key} action={{
            label: key === 'filters' ? 'Filtros' : key === 'table' ? 'Tabela' : 'Cards', icon: key === 'filters' ? 'sliders' : key === 'table' ? 'list' : 'grid', color: text,
            onPress: () => {if (key === 'filters') setModal('filters'); else {setMode(key); setModal('');}},
            style: {width: '100%', minHeight: 48, justifyContent: 'flex-start', paddingHorizontal: 12, borderWidth: 0, backgroundColor: key === mode ? c.defaultFilter_chipSelectedBackground || c.defaultFilter_inputBackground : c.defaultFilter_inputBackground}, labelStyle: {fontSize: 14}}} />) : null}
          {collapsed ? <DefaultToolbarAction action={{label: 'Colunas visíveis', icon: 'columns', onPress: () => setModal('columns'), color: text,
          style: {width: '100%', minHeight: 48, justifyContent: 'flex-start', paddingHorizontal: 12, borderWidth: 0, backgroundColor: c.defaultFilter_inputBackground}, labelStyle: {fontSize: 14}}} /> : null}
          {actions.filter(action => !action.hidden).map(action => <DefaultToolbarAction key={action.key || action.icon}
            action={{...action, label: action.label || action.accessibilityLabel, color: text,
              style: {width: '100%', minHeight: 48, justifyContent: 'flex-start', paddingHorizontal: 12, borderWidth: 0, backgroundColor: c.defaultFilter_inputBackground}, labelStyle: {fontSize: 14, fontWeight: '400'},
              onPress: () => {setModal(''); action.onPress?.();}}} />)}
          <DefaultDebug storeName={storeName} />
        </View>}
      </DefaultCompactDialog>
    </View>
  );
}

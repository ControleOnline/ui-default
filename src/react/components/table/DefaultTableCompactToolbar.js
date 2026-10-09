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
  const [modal, setModal] = useState('');
  const searchKey = configs.searchKey || 'search';
  const [draft, setDraft] = useState(String(filters[searchKey] || ''));
  useEffect(() => setDraft(String(filters[searchKey] || '')), [filters[searchKey]]);
  const entries = Object.entries(filters).filter(([, value]) => isActiveTableFilter(value));
  const text = c.textPrimary || c.text;
  const muted = c.textSecondary || text;
  const panel = c.panelBackground || c.cardBackground || c.appBackground;
  const border = c.inputBorder || c.cardBorder || c.border;
  const apply = next => {
    persistTableFiltersPreference(configs.tablePreferenceScope, next);
    if (configs.onFilterChange) configs.onFilterChange(next);
    else store.actions?.setFilters?.(next);
  };
  const remove = key => {const next = {...filters}; delete next[key]; apply(next);};
  const submit = () => {const next = {...filters}; if (draft.trim()) next[searchKey] = draft.trim(); else delete next[searchKey]; apply(next);};
  const button = (label, icon, onPress, selected = false, primary = false) => (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress}
      style={[s.button, {backgroundColor: primary ? c.buttonBackground : selected ? c.chipSelectedBackground || panel : panel, borderColor: border}, !mobile && icon === 'sliders' ? {marginLeft: 'auto'} : null]}>
      <Icon name={icon} size={16} color={primary ? c.buttonIcon || c.buttonText : text} />
      {label && (!mobile || width >= 360 && (label === 'Filtros' || primary)) ? <Text style={[s.label, {color: primary ? c.buttonText : text}]}>{primary && mobile ? 'Novo' : label}</Text> : null}
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
    <View style={[s.toolbar, {backgroundColor: c.toolbarBackground || panel, borderBottomColor: border}]}>
      <View style={[s.row, {gap: mobile ? 6 : 8}]}>
        {configs.showSearch !== false ? <View style={[s.search, mobile && s.searchMobile, {borderColor: border, backgroundColor: c.inputBackground || panel}]}>
          <Icon name="search" size={16} color={c.inputIcon || muted} />
          <TextInput accessibilityLabel={configs.searchPlaceholder || 'Buscar'} placeholder={configs.searchPlaceholder || 'Buscar'} placeholderTextColor={c.inputPlaceholderText || muted}
            value={draft} onChangeText={setDraft} onSubmitEditing={submit} returnKeyType="search" style={[s.input, mobile && s.inputMobile, {color: c.inputText || text}]} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Pesquisar" onPress={submit} style={{padding: 8}}><Icon name="arrow-right" size={16} color={text} /></TouchableOpacity>
        </View> : null}
        {showControls ? <>
          {button('Filtros', 'sliders', () => setModal('filters'))}
          <View style={s.mode}>{button('Tabela', 'list', () => setMode('table'), mode === 'table')}{button('Cards', 'grid', () => setMode('cards'), mode === 'cards')}</View>
          {!mobile ? columnButton() : null}
          {button('Mais opções', 'more-horizontal', () => setModal('more'))}
          {canAdd ? addButton() : null}
        </> : null}
      </View>
      {entries.length ? <View style={s.chips}>{entries.map(([key, value]) => {
        const column = columns.find(item => getColumnKey(item) === key);
        const options = column ? configs.getOptionsForColumn?.(column) || column.options || [] : [];
        const valueLabel = Array.isArray(options) ? (Array.isArray(value) ? value : [value]).map(item => options.find(option => String(option.value ?? option.key) === String(item))?.label || getCompactFilterLabel(item)).join(', ') : getCompactFilterLabel(value);
        const label = `${column ? labelFor(column) + ': ' : key === searchKey ? 'Busca: ' : key + ': '}${valueLabel}`;
        return <TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={`Remover filtro ${label}`} onPress={() => remove(key)} style={[s.chip, {borderColor: border, backgroundColor: c.chipBackground || panel}]}>
          <Text numberOfLines={1} style={[s.small, {color: c.chipText || text, flexShrink: 1}]}>{label}</Text><Icon name="x" size={12} color={text} />
        </TouchableOpacity>;
      })}<TouchableOpacity accessibilityRole="button" onPress={() => apply({})}><Text style={[s.small, {color: muted}]}>Limpar filtros</Text></TouchableOpacity></View> : null}
      <View style={s.secondary}>
        <Text style={[s.small, {color: muted}]}>{configs.showTotalItemsInFooter !== false ? `${store.getters?.totalItems ?? 0} ${Number(store.getters?.totalItems) === 1 ? 'resultado' : 'resultados'}` : 'Pedidos'}</Text>
        {showControls ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Escolher ordenação" onPress={() => setModal('sort')} style={s.row}>
          <Icon name="arrow-down" size={14} color={muted} /><Text style={[s.small, {color: text}]}>{sortColumn ? labelFor(sortColumn) : 'Ordenar'} · {configs.resolvedSort?.direction === 'asc' ? '↑' : '↓'}</Text>
        </TouchableOpacity> : null}
      </View>
      <DefaultFiltersModal storeName={storeName} visible={modal === 'filters'} deferred onClose={() => setModal('')} />
      <DefaultColumnMenu storeName={storeName} visible={modal === 'columns'} onClose={() => setModal('')} />
      <DefaultCompactDialog visible={modal === 'more' || modal === 'sort'} title={modal === 'sort' ? 'Ordenação' : 'Mais opções'}
        description={modal === 'sort' ? 'Escolha a coluna. Toque novamente para inverter a ordem.' : undefined}
        onClose={() => setModal('')} bodyHeight={modal === 'sort' ? columns.filter(isSortableColumn).length * 54 + 32 : 180}>
        {modal === 'sort' ? columns.filter(isSortableColumn).map(column => <TouchableOpacity key={getColumnKey(column)} accessibilityRole="button"
          accessibilityLabel={`Ordenar por ${labelFor(column)}`} style={[s.option, {borderBottomWidth: 1, borderBottomColor: c.tableRowBorder}]}
          onPress={() => {configs.requestSort?.(column); setModal('');}}>
          <Text style={{color: text, fontSize: 14}}>{labelFor(column)}</Text><Text style={{color: muted}}>{getSortField(column) === configs.resolvedSort?.field ? configs.resolvedSort.direction === 'asc' ? '↑' : '↓' : '↕'}</Text>
        </TouchableOpacity>) : <View style={{gap: 8}}>{mobile ? <DefaultToolbarAction action={{label: 'Colunas visíveis', icon: 'columns', onPress: () => setModal('columns'), color: text,
          style: {width: '100%', minHeight: 48, justifyContent: 'flex-start', paddingHorizontal: 12, borderWidth: 0, backgroundColor: c.inputBackground}, labelStyle: {fontSize: 14}}} /> : null}
          {actions.filter(action => !action.hidden).map(action => <DefaultToolbarAction key={action.key || action.icon}
            action={{...action, label: action.label || action.accessibilityLabel, color: text,
              style: {width: '100%', minHeight: 48, justifyContent: 'flex-start', paddingHorizontal: 12, borderWidth: 0, backgroundColor: c.inputBackground}, labelStyle: {fontSize: 14, fontWeight: '400'},
              onPress: () => {setModal(''); action.onPress?.();}}} />)}
          <DefaultDebug storeName={storeName} />
        </View>}
      </DefaultCompactDialog>
    </View>
  );
}

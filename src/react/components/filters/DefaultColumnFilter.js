import React from 'react';
import { TextInput, View } from 'react-native';
import {
  buildOptionsFromColumn,
  getColumnKey,
  normalizeOptionKey,
  normalizeText,
} from '../inputs/defaultInputUtils';
import CompactFilterSelector from './CompactFilterSelector';
import DateShortcutFilter from './DateShortcutFilter';
import styles from './DefaultColumnFilter.styles';

const DefaultColumnFilter = ({
  accentColor = '#2563EB',
  column,
  filters = {},
  getOptionsForColumn = null,
  onChange = null,
  storeName = '',
  style = null,
}) => {
  const fieldName = getColumnKey(column);

  if (column?.filter === false || column?.filters === false) {
    return <View style={style} />;
  }

  if (column?.inputType === 'date-range') {
    const filterValue = filters?.[fieldName] || {};
    return (
      <View style={[style, styles.filterCell]}>
        <DateShortcutFilter
          dense
          store={storeName}
          field={fieldName}
          value={filterValue.shortcut || 'all'}
          customRange={filterValue.customRange || { from: '', to: '' }}
          onChange={optionKey => onChange?.(fieldName, optionKey === 'all' ? null : {
            ...(filterValue || {}),
            shortcut: optionKey,
          })}
          onCustomRangeChange={range => onChange?.(fieldName, {
            ...(filterValue || {}),
            shortcut: 'custom',
            customRange: range,
          })}
        />
      </View>
    );
  }

  if (column?.list) {
    const rawOptions = buildOptionsFromColumn(column, getOptionsForColumn);
    const options = [
      { key: '', label: global.t?.t(storeName, 'label', 'select') || 'Todos' },
      ...rawOptions,
    ];
    const selectedKey = normalizeOptionKey(filters?.[fieldName]);
    const selected = options.find(option => option.key === selectedKey);

    return (
      <View style={[style, styles.filterCell]}>
        <CompactFilterSelector
          dense
          store={storeName}
          field={fieldName}
          icon="filter"
          accentColor={accentColor}
          active={Boolean(selectedKey)}
          label={selected?.label || options[0]?.label || ''}
          options={options}
          selectedKey={selectedKey}
          onSelect={optionKey => {
            onChange?.(fieldName, optionKey);
            return true;
          }}
        />
      </View>
    );
  }

  return (
    <View style={[style, styles.filterCell]}>
      <TextInput
        style={styles.filterInput}
        value={normalizeText(filters?.[fieldName])}
        placeholder={global.t?.t(storeName, 'input', column?.label || fieldName)}
        onChangeText={value => onChange?.(fieldName, value)}
      />
    </View>
  );
};

export default DefaultColumnFilter;

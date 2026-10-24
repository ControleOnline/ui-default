import React from 'react';
import {Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useStore} from '@store';
import useDefaultTableTheme from './useDefaultTableTheme';
import {getVisiblePageNumbers} from './DefaultTableCompact.helpers';
import s from './DefaultTableCompact.styles';

export default function DefaultTablePaginationBar({storeName}) {
  const mobile = useWindowDimensions().width <= 768;
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const {themeColors: c} = useDefaultTableTheme();
  if (configs.paginationMode !== 'pages') return null;
  const page = configs.currentPage || 1;
  const size = configs.pageSizeNumber || 20;
  const total = Number(store.getters.totalItems || 0);
  const pages = Math.max(1, Math.ceil(total / size));
  const busy = Boolean(configs.paginationLoading);
  const text = c.tableFooterText || c.textPrimary;
  const background = c.tableFooterBackground || c.panelBackground;
  const border = c.tableFooterBorder || c.inputBorder;
  const button = (value, icon, label, disabled = false) => <TouchableOpacity key={label} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{disabled: disabled || busy, selected: !icon && page === value}} disabled={disabled || busy}
    onPress={() => configs.onPageChange?.(value)} style={[s.page, {backgroundColor: !icon && page === value ? c.chipSelectedBackground || c.badgeBackground : background, borderColor: border}, (disabled || busy) && s.disabled]}>
    {icon ? <Icon name={icon} size={16} color={text} /> : <Text style={[s.small, {color: text}]}>{value}</Text>}
  </TouchableOpacity>;
  return <View testID="default-table-pagination" style={[s.footer, {backgroundColor: background, borderTopColor: border}]}>
    <Text accessibilityLiveRegion="polite" style={[s.small, {color: text}]}>{configs.showTotalItemsInFooter === false ? `Página ${page}` : `${total ? (page - 1) * size + 1 : 0}–${Math.min(page * size, total)} de ${total}`}</Text>
    <View style={s.pager}>
      {!mobile ? button(1, 'chevrons-left', 'Primeira página', page === 1) : null}
      {button(page - 1, 'chevron-left', 'Página anterior', page === 1)}
      {getVisiblePageNumbers(page, pages).map(value => button(value, null, `Página ${value}`))}
      {button(page + 1, 'chevron-right', 'Próxima página', page >= pages)}
      {!mobile ? button(pages, 'chevrons-right', 'Última página', page >= pages) : null}
    </View>
  </View>;
}

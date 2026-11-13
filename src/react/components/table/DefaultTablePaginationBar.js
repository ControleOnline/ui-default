import React from 'react';
import {Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useStore} from '@store';
import useDefaultTableTheme from './useDefaultTableTheme';
import {getVisiblePageNumbers} from './DefaultTableCompact.helpers';
import s from './DefaultTableCompact.styles';

/**
 * Desktop/tablet only. Mobile keeps infinite scroll (no page buttons).
 * Renders as a compact trailing segment for the unified footer row.
 */
export default function DefaultTablePaginationBar({storeName, embedded = false}) {
  const mobile = useWindowDimensions().width <= 768;
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const {themeColors: c} = useDefaultTableTheme();
  if (mobile || configs.paginationMode !== 'pages') return null;
  const page = configs.currentPage || 1;
  const size = configs.pageSizeNumber || 20;
  const total = Number(store.getters.totalItems || 0);
  const pages = Math.max(1, Math.ceil(total / size));
  const busy = Boolean(configs.paginationLoading);
  const text = c.tableFooterText || c.textPrimary;
  const background = c.tableFooterBackground || c.panelBackground;
  const border = c.tableFooterBorder || c.inputBorder;
  const button = (value, icon, label, disabled = false) => (
    <TouchableOpacity
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled: disabled || busy, selected: !icon && page === value}}
      disabled={disabled || busy}
      onPress={() => configs.onPageChange?.(value)}
      style={[
        s.page,
        {
          backgroundColor: !icon && page === value ? c.chipSelectedBackground || c.badgeBackground : background,
          borderColor: border,
        },
        (disabled || busy) && s.disabled,
      ]}>
      {icon ? <Icon name={icon} size={13} color={text} /> : <Text style={[s.small, {color: text, fontSize: 11}]}>{value}</Text>}
    </TouchableOpacity>
  );
  const t = global.t?.t;
  const pageWord = t?.(storeName, 'label', 'page') || t?.('configs', 'label', 'page') || 'Página';
  const ofWord = t?.(storeName, 'label', 'of') || t?.('configs', 'label', 'of') || 'de';
  const rangeLabel =
    configs.showTotalItemsInFooter === false
      ? `${pageWord} ${page}`
      : `${total ? (page - 1) * size + 1 : 0}–${Math.min(page * size, total)} ${ofWord} ${total}`;
  const body = (
    <>
      <Text accessibilityLiveRegion="polite" style={[s.small, {color: text, fontSize: 11, flexShrink: 0}]}>
        {rangeLabel}
      </Text>
      <View style={s.pager}>
        {button(1, 'chevrons-left', 'Primeira página', page === 1)}
        {button(page - 1, 'chevron-left', 'Página anterior', page === 1)}
        {getVisiblePageNumbers(page, pages).map(value => button(value, null, `Página ${value}`))}
        {button(page + 1, 'chevron-right', 'Próxima página', page >= pages)}
        {button(pages, 'chevrons-right', 'Última página', page >= pages)}
      </View>
    </>
  );
  if (embedded) {
    return (
      <View testID="default-table-pagination" style={{flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0}}>
        {body}
      </View>
    );
  }
  return (
    <View testID="default-table-pagination" style={[s.footer, {backgroundColor: background, borderTopColor: border}]}>
      {body}
    </View>
  );
}

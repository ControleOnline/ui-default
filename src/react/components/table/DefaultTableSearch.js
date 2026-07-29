import React from 'react';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import DefaultSearch from '../filters/DefaultSearch';
import DefaultModalButton from './DefaultModalButton';
import DefaultSearchModal from './DefaultSearchModal';
import {
  COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH,
} from './DefaultTable.utils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const shouldRenderSearch = store => {
  const configs = store?.getters?.configs || {};

  if (configs.showSearch === true) return true;
  if (configs.showSearch === false) return false;

  const columns = Array.isArray(store?.getters?.columns) ? store.getters.columns : [];

  return columns.some(column =>
    column?.search === true ||
    column?.searchable === true ||
    column?.filter === 'search',
  );
};

const useSearchState = storeName => {
  const store = useStore(storeName);
  const { width } = useWindowDimensions();
  const configs = store?.getters?.configs || {};
  const totalItemsNumber = Number(store?.getters?.totalItems);
  const hasTotalItems = Number.isFinite(totalItemsNumber);
  const compactBreakpoint = Number(configs.compactBreakpoint || COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH);
  const rendersCompactTotal =
    configs.showTotalItemsInCompactToolbar === true &&
    width > 0 &&
    width <= compactBreakpoint &&
    hasTotalItems &&
    configs.showTotalItemsInFooter === false;
  const collapses =
    width > 0 && width <= COLLAPSED_SEARCH_MAX_VIEWPORT_WIDTH;

  return {
    collapses,
    renders: shouldRenderSearch(store),
    rendersCompactTotal,
  };
};

export const DefaultTableCompactSearch = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { renders, rendersCompactTotal } = useSearchState(storeName);

  return renders && rendersCompactTotal ? (
    <DefaultSearch
      compact
      placeholder={configs.searchPlaceholder}
      searchKey={configs.searchKey || 'search'}
      storeName={storeName}
    />
  ) : null;
};

export const DefaultTableInlineSearch = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { collapses, renders, rendersCompactTotal } = useSearchState(storeName);

  return renders && !rendersCompactTotal && !collapses ? (
    <DefaultSearch
      compact
      placeholder={configs.searchPlaceholder}
      searchKey={configs.searchKey || 'search'}
      storeName={storeName}
    />
  ) : null;
};

export const DefaultTableCollapsedSearch = ({ storeName }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { collapses, renders, rendersCompactTotal } = useSearchState(storeName);
  const { tableButtonColors } = useDefaultTableTheme();

  if (!renders || rendersCompactTotal || !collapses) {
    return null;
  }

  return (
    <DefaultModalButton
      renderButton={({ open }) => (
        <TouchableOpacity
          style={[
            styles.toolbarSearchButton,
            {
              borderColor: tableButtonColors.borderColor,
              backgroundColor: tableButtonColors.backgroundColor,
            },
          ]}
          accessibilityLabel={global.t?.t(storeName, 'label', 'search')}
          accessibilityRole="button"
          activeOpacity={0.82}
          onPress={open}
        >
          <Icon name="search" size={14} color={tableButtonColors.iconColor} />
        </TouchableOpacity>
      )}
    >
      {({ close, isOpen }) => (
          <DefaultSearchModal
            searchKey={configs.searchKey || 'search'}
            searchPlaceholder={configs.searchPlaceholder}
            storeName={storeName}
            visible={isOpen}
          onClose={close}
        />
      )}
    </DefaultModalButton>
  );
};

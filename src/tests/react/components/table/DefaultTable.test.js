const React = require('react');
const renderer = require('react-test-renderer');

const {afterEach, beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

let consoleErrorSpy = null;
let mockStores = {};
let mockWindowDimensions = {width: 480, height: 800};
let mockCapturedColumnFilterProps = [];
let mockCapturedDefaultInputProps = [];

const createLocalStorageMock = () => {
  let storage = {};

  return {
    clear: () => {
      storage = {};
    },
    getItem: key => (key in storage ? storage[key] : null),
    removeItem: key => {
      delete storage[key];
    },
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  };
};

jest.mock('@store', () => ({
  getAllStores: jest.fn(() => ({})),
  useStore: jest.fn(name => mockStores[name] || {actions: {}, getters: {}}),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => false),
  useRoute: jest.fn(() => ({
    key: 'OrderHistoryPage-key',
    name: 'OrderHistoryPage',
  })),
}));

jest.mock('@controleonline/ui-common/src/react/components/MessageService', () => ({
  useMessage: jest.fn(() => ({
    showError: jest.fn(),
  })),
}));

jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  return props => React.createElement('icon', props, props.children);
});

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = name => props =>
    React.createElement(name, props, props.children);

  const FlatList = props => {
    const items = Array.isArray(props.data) ? props.data : [];

    return React.createElement(
      'FlatList',
      props,
      items.map((item, index) =>
        props.renderItem ? props.renderItem({item, index}) : null,
      ),
      items.length === 0 && props.ListEmptyComponent ? props.ListEmptyComponent : null,
      props.ListFooterComponent || null,
    );
  };

  return {
    FlatList,
    Modal: createComponent('Modal'),
    Platform: {
      select: value => value.web || value.default || null,
    },
    ScrollView: createComponent('ScrollView'),
    StyleSheet: {create: value => value},
    Text: createComponent('Text'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    View: createComponent('View'),
    useWindowDimensions: jest.fn(() => mockWindowDimensions),
  };
});

jest.mock('../../../../react/components/filters/DefaultColumnFilter', () => props => {
  const React = require('react');
  mockCapturedColumnFilterProps.push(props);
  return React.createElement('DefaultColumnFilter', props);
});

jest.mock('../../../../react/components/filters/DefaultSearch', () => props => {
  const React = require('react');
  return React.createElement('DefaultSearch', props);
});

jest.mock('../../../../react/components/form/DefaultForm', () => () => {
  const React = require('react');
  return React.createElement('DefaultForm');
});

jest.mock('../../../../react/components/inputs/DefaultInput', () => props => {
  const React = require('react');
  mockCapturedDefaultInputProps.push(props);
  return React.createElement('DefaultInput', props);
});

jest.mock('@controleonline/ui-common/src/react/components/StateStore', () => props => {
  const React = require('react');
  return React.createElement('StateStore', props, props.children);
});

const {
  default: DefaultTable,
  resolveColumnListLoadParams,
} = require('../../../../react/components/table/DefaultTable');
const {
  DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
} = require('../../../../react/utils/tableVisibleColumnsPreferences');

describe('resolveColumnListLoadParams', () => {
  it('uses company for category stores and people for financial owner stores', () => {
    expect(resolveColumnListLoadParams({
      column: {list: 'categories/getItems'},
      currentCompanyId: 21,
    })).toEqual({company: 21});
    expect(resolveColumnListLoadParams({
      column: {list: 'wallet/getItems'},
      currentCompanyId: 21,
    })).toEqual({people: 21});
    expect(resolveColumnListLoadParams({
      column: {list: 'paymentType/getItems'},
      currentCompanyId: 21,
    })).toEqual({people: 21});
  });

  it('resolves contextual list params without losing the company scope', () => {
    expect(resolveColumnListLoadParams({
      column: {
        list: 'categories/getItems',
        listRequestParams: ({requestParams}) => ({context: requestParams.context}),
      },
      currentCompanyId: 21,
      requestParams: {context: 'receive'},
    })).toEqual({company: 21, context: 'receive'});
  });
});

describe('DefaultTable', () => {
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockWindowDimensions = {width: 480, height: 800};
    mockCapturedColumnFilterProps = [];
    mockCapturedDefaultInputProps = [];
    global.localStorage = createLocalStorageMock();

    mockStores = {
      people: {
        getters: {
          currentCompany: {
            theme: {
              colors: {},
            },
          },
        },
      },
      theme: {
        getters: {
          colors: {},
        },
      },
    };
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
      consoleErrorSpy = null;
    }
  });

  it('keeps the list/card toggle visible on compact layouts even when cards are forced', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          showColumnFiltersButton: false,
        }),
      );
    });

    const iconNames = tree.root.findAllByType('icon').map(node => node.props.name);

    expect(iconNames).toEqual(expect.arrayContaining(['grid', 'columns']));
  });

  it('keeps the complete search aligned in the toolbar when there is enough room', () => {
    mockWindowDimensions = {width: 430, height: 932};
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          searchProps: {placeholder: 'Buscar pedidos'},
        }),
      );
    });

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(1);
    expect(tree.root.findAllByType('icon').map(node => node.props.name)).not.toContain('search');
  });

  it('collapses search into an icon on narrow toolbars and opens the search modal', () => {
    mockWindowDimensions = {width: 375, height: 667};
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          searchProps: {placeholder: 'Buscar pedidos'},
        }),
      );
    });

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(0);
    const searchButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'search'));

    expect(searchButton.props.accessibilityRole).toBe('button');
    expect(searchButton.props.accessibilityLabel).toBe('Buscar pedidos');

    renderer.act(() => searchButton.props.onPress());

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(1);
    expect(tree.root.findByType('DefaultSearch').props.autoFocus).toBe(true);
  });

  it('gives collapsed search a stable accessible name without a placeholder', () => {
    mockWindowDimensions = {width: 375, height: 667};
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          searchProps: {},
        }),
      );
    });

    const searchButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'search'));

    expect(searchButton.props.accessibilityRole).toBe('button');
    expect(searchButton.props.accessibilityLabel).toBe('Buscar');
  });

  it('keeps the financial compact toolbar aligned when the total is already in the footer', () => {
    mockWindowDimensions = {width: 375, height: 667};
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          searchProps: {placeholder: 'Buscar lançamentos'},
          showTotalItemsInCompactToolbar: true,
          showTotalItemsInFooter: true,
          totalItems: 27,
        }),
      );
    });

    const iconNames = tree.root.findAllByType('icon').map(node => node.props.name);

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(0);
    expect(iconNames).toEqual(expect.arrayContaining(['search', 'filter', 'grid', 'columns']));
    expect(
      tree.root.findAllByType('Text').filter(node => node.props.children === '27 registros'),
    ).toHaveLength(1);
  });

  it('opens the filters modal with filterable columns only', () => {
    mockWindowDimensions = {width: 375, height: 667};
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [
            {key: 'name', label: 'Nome'},
            {key: 'ignored', label: 'Ignorado', filter: false},
            {
              key: 'status',
              label: 'Status',
              list: [{value: 'pos', label: 'POS'}],
            },
          ],
          data: [],
        }),
      );
    });

    expect(tree.root.findAllByType('DefaultColumnFilter')).toHaveLength(0);
    const filterButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'filter'));

    renderer.act(() => filterButton.props.onPress());

    expect(tree.root.findAllByType('DefaultColumnFilter')).toHaveLength(2);
    expect(mockCapturedColumnFilterProps.map(props => props.column.key)).toEqual(['name', 'status']);
  });

  it('persists filters and sort under default-table[store][route]', () => {
    const setFilters = jest.fn();
    mockWindowDimensions = {width: 1024, height: 800};
    mockStores.orders = {
      actions: {
        setFilters,
      },
      getters: {
        columns: [
          {key: 'status', label: 'Status', sortable: true},
          {key: 'price', label: 'Preco'},
        ],
        filters: {},
      },
    };

    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          searchProps: {placeholder: 'Buscar pedidos'},
          storeName: 'orders',
        }),
      );
    });

    renderer.act(() => {
      tree.root.findByType('DefaultSearch').props.onChangeFilters({
        search: '72813',
      });
    });

    const statusHeader = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('Text').some(text => text.props.children === 'Status'));

    renderer.act(() => {
      statusHeader.props.onPress();
    });

    expect(setFilters).toHaveBeenCalledWith({search: '72813'});
    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      orders: {
        OrderHistoryPage: {
          filters: {
            search: '72813',
          },
          sort: {
            direction: 'asc',
            field: 'status',
          },
        },
      },
    });
  });

  it('hydrates and persists controlled filters under default-table[store][route]', () => {
    const onFilterChange = jest.fn();
    const setFilters = jest.fn();
    global.location = {pathname: '/product-showcases-page'};
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        product_showcase_items: {
          'product-showcases-page': {
            filters: {
              integration: 'pos',
            },
          },
        },
      }),
    );
    mockStores.product_showcase_items = {
      actions: {
        setFilters,
      },
      getters: {
        columns: [
          {key: 'integration', label: 'Integration', externalFilter: true},
          {key: 'price', label: 'Price'},
        ],
        filters: {},
      },
    };

    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          filters: {},
          onFilterChange,
          storeName: 'product_showcase_items',
        }),
      );
    });

    expect(onFilterChange).toHaveBeenCalledWith({integration: 'pos'});

    renderer.act(() => {
      tree.update(
        React.createElement(DefaultTable, {
          filters: {integration: 'ifood'},
          onFilterChange,
          storeName: 'product_showcase_items',
        }),
      );
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      product_showcase_items: {
        'product-showcases-page': {
          filters: {
            integration: 'ifood',
          },
        },
      },
    });

    delete global.location;
  });

  it('preserves the compact toolbar total when the footer total is disabled', () => {
    mockWindowDimensions = {width: 375, height: 667};
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          showTotalItemsInCompactToolbar: true,
          showTotalItemsInFooter: false,
          totalItems: 27,
        }),
      );
    });

    expect(tree.root.findAllByType('Text').map(node => node.props.children)).toContain('27 registros');
  });

  it('forces cards when entering compact mode and still toggles between cards and list', () => {
    const props = {
      columns: [{key: 'name', label: 'Nome'}],
      data: [{id: 1, name: 'Pedido 1'}],
      showColumnFiltersButton: false,
    };
    let tree;

    mockWindowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, props),
      );
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);

    mockWindowDimensions = {width: 480, height: 800};

    renderer.act(() => {
      tree.update(React.createElement(DefaultTable, props));
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'grid'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'grid'}).parent.props.onPress();
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'list'}).parent.props.onPress();
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'grid'})).toBeTruthy();
  });

  it('applies a custom rowStyle to rendered table rows', () => {
    let tree;
    const rowStyle = jest.fn(() => ({
      borderLeftColor: '#DC2626',
      borderLeftWidth: 4,
    }));

    mockWindowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [{id: 1, name: 'Pedido 1'}],
          onRowPress: () => {},
          rowStyle,
          showColumnFiltersButton: false,
        }),
      );
    });

    const row = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.props?.activeOpacity === 0.84);

    expect(rowStyle).toHaveBeenCalledWith(
      expect.objectContaining({id: 1, name: 'Pedido 1'}),
      0,
    );
    expect(Array.isArray(row.props.style)).toBe(true);
    expect(
      row.props.style.some(
        style => style && style.borderLeftWidth === 4 && style.borderLeftColor === '#DC2626',
      ),
    ).toBe(true);
  });

  it('blocks row navigation while an inline cell is editing or saving', async () => {
    let resolveSave;
    const onRowPress = jest.fn();
    const save = jest.fn(() => new Promise(resolve => {
      resolveSave = resolve;
    }));
    let tree;

    mockWindowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          actions: {save},
          columns: [{key: 'name', label: 'Nome', editable: true}],
          data: [{id: 1, name: 'Cliente'}],
          onRowPress,
          showColumnFiltersButton: false,
          showRowActions: false,
        }),
      );
    });

    const findRow = () => tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.props?.activeOpacity === 0.84);
    const latestInput = () => mockCapturedDefaultInputProps[mockCapturedDefaultInputProps.length - 1];

    renderer.act(() => {
      findRow().props.onPress();
    });
    expect(onRowPress).toHaveBeenCalledTimes(1);
    onRowPress.mockClear();

    renderer.act(() => {
      latestInput().onStartEditing();
    });
    renderer.act(() => {
      findRow().props.onPress();
    });
    expect(onRowPress).not.toHaveBeenCalled();

    let savePromise;
    renderer.act(() => {
      savePromise = latestInput().onSave('Cliente alterado');
    });
    renderer.act(() => {
      latestInput().onCancelEditing();
    });
    renderer.act(() => {
      findRow().props.onPress();
    });
    expect(onRowPress).not.toHaveBeenCalled();

    await renderer.act(async () => {
      resolveSave({id: 1, name: 'Cliente alterado'});
      await savePromise;
    });

    renderer.act(() => {
      findRow().props.onPress();
    });
    expect(onRowPress).toHaveBeenCalledTimes(1);
  });

  it('protects custom card openRow while a card field is editing', () => {
    const onRowPress = jest.fn();
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome', editable: true}],
          data: [{id: 1, name: 'Cliente'}],
          onRowPress,
          renderCard: ({openRow, renderField}) => React.createElement(
            'CustomCard',
            {openRow},
            renderField('name'),
          ),
          showColumnFiltersButton: false,
          showRowActions: false,
        }),
      );
    });

    const latestInput = () => mockCapturedDefaultInputProps[mockCapturedDefaultInputProps.length - 1];

    renderer.act(() => {
      latestInput().onStartEditing();
    });
    renderer.act(() => {
      tree.root.findByType('CustomCard').props.openRow();
    });
    expect(onRowPress).not.toHaveBeenCalled();

    renderer.act(() => {
      latestInput().onCancelEditing();
    });
    renderer.act(() => {
      tree.root.findByType('CustomCard').props.openRow();
    });
    expect(onRowPress).toHaveBeenCalledTimes(1);
  });

  it('renders a custom footer component when provided', () => {
    let tree;

    const FooterComponent = props =>
      React.createElement('CustomFooter', {
        resolvedTotalItemsText: props.resolvedTotalItemsText,
      });

    mockWindowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [{id: 1, name: 'Pedido 1'}],
          footerComponent: FooterComponent,
          showColumnFiltersButton: false,
          totalItemsText: '7 pedidos',
        }),
      );
    });

    const footer = tree.root.findByType('CustomFooter');

    expect(footer.props.resolvedTotalItemsText).toBe('7 pedidos');
  });

  it('uses store actions when no explicit table actions are passed', async () => {
    const save = jest.fn(() => Promise.resolve({
      id: 1,
      jobTitle: '/categories/2',
    }));

    mockStores.employee_profiles = {
      actions: {
        save,
      },
      getters: {
        columns: [],
      },
    };

    await renderer.act(async () => {
      renderer.create(
        React.createElement(DefaultTable, {
          columns: [
            {
              key: 'jobTitle',
              label: 'Cargo',
              editable: true,
              list: 'categories/getItems',
              formatList: item => ({
                value: item.id,
                label: item.name,
              }),
              saveFormat: value => `/categories/${parseInt(value.value || value, 10)}`,
            },
          ],
          data: [{
            id: 1,
            jobTitle: '/categories/1',
          }],
          showColumnFiltersButton: false,
          showRowActions: false,
          storeName: 'employee_profiles',
        }),
      );
    });

    expect(mockCapturedDefaultInputProps.length).toBeGreaterThan(0);

    await renderer.act(async () => {
      await mockCapturedDefaultInputProps[0].onSave({
        value: '2',
        label: 'Departamento',
        object: {id: 2, name: 'Departamento'},
      });
    });

    expect(save).toHaveBeenCalledWith({
      id: '1',
      jobTitle: '/categories/2',
    });
  });
});

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
  NavigationRouteContext: require('react').createContext(undefined),
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
  mergeSortedDataWithLiveItems,
  resolveColumnListLoadParams,
  shouldTriggerEndReachedFromScroll,
} = require('../../../../react/components/table/DefaultTable');
const {
  DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
} = require('../../../../react/utils/tableVisibleColumnsPreferences');
const reactNavigation = require('@react-navigation/native');
const {getAllStores} = require('@store');
const STORE_ACTION_META_KEY = '__storeMeta';

const flattenStyle = style => {
  if (Array.isArray(style)) {
    return style.reduce(
      (acc, item) => ({
        ...acc,
        ...flattenStyle(item),
      }),
      {},
    );
  }

  return style && typeof style === 'object' ? style : {};
};

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

describe('mergeSortedDataWithLiveItems', () => {
  it('keeps the sorted order and replaces stale rows with live store items', () => {
    const sortedData = [
      {
        '@id': '/invoices/332',
        id: 332,
        status: {id: 32, status: 'open'},
      },
      {
        '@id': '/invoices/333',
        id: 333,
        status: {id: 33, status: 'paid'},
      },
    ];
    const liveItems = [
      {
        id: 333,
        status: {id: 33, status: 'paid'},
      },
      {
        id: 332,
        status: {id: 33, status: 'paid'},
      },
      {
        id: 334,
        status: {id: 33, status: 'paid'},
      },
    ];

    const mergedData = mergeSortedDataWithLiveItems({liveItems, sortedData});

    expect(mergedData.map(item => item.id)).toEqual([332, 333]);
    expect(mergedData[0].status.status).toBe('paid');
  });
});

describe('shouldTriggerEndReachedFromScroll', () => {
  it('returns true before the scroll reaches the exact end', () => {
    expect(shouldTriggerEndReachedFromScroll({
      nativeEvent: {
        contentOffset: {y: 650},
        contentSize: {height: 1200},
        layoutMeasurement: {height: 400},
      },
    })).toBe(true);

    expect(shouldTriggerEndReachedFromScroll({
      nativeEvent: {
        contentOffset: {y: 100},
        contentSize: {height: 1200},
        layoutMeasurement: {height: 400},
      },
    })).toBe(false);
  });
});

describe('DefaultTable', () => {
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockWindowDimensions = {width: 480, height: 800};
    mockCapturedColumnFilterProps = [];
    mockCapturedDefaultInputProps = [];
    getAllStores.mockImplementation(() => ({}));
    global.localStorage = createLocalStorageMock();
    global.t = {
      t: jest.fn((store, type, key) => {
        if (type === 'label' && key === 'search') return 'Buscar';
        if (type === 'label' && key === 'items') return 'registros';
        if (type === 'label' && key === 'loading') return 'Carregando...';
        if (type === 'label' && key === 'empty') return 'Nenhum registro encontrado';
        if (type === 'label' && key === 'filters') return 'Filtros';
        if (type === 'label' && key === 'select') return 'Selecionar';
        if (type === 'button' && key === 'add') return 'Adicionar';
        if (type === 'button' && key === 'edit') return 'Editar';
        if (type === 'button' && key === 'apply') return 'Aplicar';
        if (type === 'button' && key === 'clear') return 'Limpar';
        if (type === 'input' && key === 'search') return 'Buscar...';
        return undefined;
      }),
    };
    reactNavigation.useIsFocused.mockImplementation(() => false);

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
    delete global.t;
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

  it('respects the compact grid/list toggle in the table body', () => {
    mockWindowDimensions = {width: 480, height: 800};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome'}],
        items: [{id: 1, name: 'Pedido'}],
        visibleColumns: {},
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          data: [{id: 1, name: 'Pedido'}],
          showColumnFiltersButton: false,
          storeName: 'orders',
        }),
      );
    });

    expect(
      tree.root.findAllByType('ScrollView').some(node => node.props.horizontal === true),
    ).toBe(false);

    const toggleViewButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'list'));

    renderer.act(() => {
      toggleViewButton.props.onPress();
      tree.update(
        React.createElement(DefaultTable, {
          data: [{id: 1, name: 'Pedido'}],
          showColumnFiltersButton: false,
          storeName: 'orders',
        }),
      );
    });

    expect(
      tree.root.findAllByType('ScrollView').some(node => node.props.horizontal === true),
    ).toBe(true);
    expect(tree.root.findAllByType('icon').map(node => node.props.name)).toContain('grid');
  });

  it('pins identity and action columns on table view', () => {
    mockWindowDimensions = {width: 1200, height: 800};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [
          {key: 'id', label: 'ID', isIdentity: true},
          {key: 'name', label: 'Nome'},
        ],
        items: [{id: 1, name: 'Pedido'}],
        visibleColumns: {},
      },
    };
    const rowActionsComponent = () => React.createElement('row-actions');
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          rowActionsComponent,
          storeName: 'orders',
        }),
      );
    });

    const renderedStyles = [
      ...tree.root.findAllByType('View'),
      ...tree.root.findAllByType('TouchableOpacity'),
    ].map(node => flattenStyle(node.props.style));

    expect(renderedStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({position: 'sticky', left: 0}),
        expect.objectContaining({position: 'sticky', right: 0}),
      ]),
    );

    const horizontalScroll = tree.root
      .findAllByType('ScrollView')
      .find(node => node.props.horizontal);

    renderer.act(() => {
      horizontalScroll.props.onLayout({nativeEvent: {layout: {width: 300}}});
      horizontalScroll.props.onContentSizeChange(600, 200);
      horizontalScroll.props.onScroll({nativeEvent: {contentOffset: {x: 120}}});
    });

    const scrolledStyles = [
      ...tree.root.findAllByType('View'),
      ...tree.root.findAllByType('TouchableOpacity'),
    ].map(node => flattenStyle(node.props.style));

    expect(scrolledStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({transform: [{translateX: 120}]}),
        expect.objectContaining({transform: [{translateX: -180}]}),
      ]),
    );
  });

  it('renders a custom row actions component with the configured actions width', () => {
    mockWindowDimensions = {width: 1200, height: 800};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [
          {key: 'id', label: 'ID', isIdentity: true},
          {key: 'name', label: 'Nome'},
        ],
        items: [{id: 12, name: 'Pedido'}],
        visibleColumns: {},
      },
    };
    const rowActionsComponent = props =>
      React.createElement('row-actions', props, props.row.name);
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          onEditRow: jest.fn(),
          rowActionsComponent,
          rowActionsWidth: 180,
          storeName: 'orders',
        }),
      );
    });

    const rowActions = tree.root.findByType('row-actions');
    expect(rowActions.props.row).toEqual({id: 12, name: 'Pedido'});
    expect(rowActions.props.storeName).toBe('orders');
    expect(typeof rowActions.props.openEdit).toBe('function');
    expect(rowActions.props.helpers).toEqual(
      expect.objectContaining({
        openEdit: expect.any(Function),
      }),
    );

    const renderedStyles = [
      ...tree.root.findAllByType('View'),
      ...tree.root.findAllByType('TouchableOpacity'),
    ].map(node => flattenStyle(node.props.style));

    expect(renderedStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flexBasis: 180,
          maxWidth: 180,
          minWidth: 180,
          width: 180,
        }),
      ]),
    );
  });

  it('keeps only the identity column pinned when row actions are not pinned', () => {
    mockWindowDimensions = {width: 1200, height: 800};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [
          {key: 'id', label: 'ID', isIdentity: true},
          {key: 'name', label: 'Nome'},
        ],
        items: [{id: 1, name: 'Pedido'}],
        visibleColumns: {},
      },
    };
    const rowActionsComponent = () => React.createElement('row-actions');
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          pinRowActions: false,
          rowActionsComponent,
          storeName: 'orders',
        }),
      );
    });

    const renderedStyles = [
      ...tree.root.findAllByType('View'),
      ...tree.root.findAllByType('TouchableOpacity'),
    ].map(node => flattenStyle(node.props.style));

    expect(renderedStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({position: 'sticky', left: 0}),
      ]),
    );
    expect(renderedStyles).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({position: 'sticky', right: 0}),
      ]),
    );

    const horizontalScroll = tree.root
      .findAllByType('ScrollView')
      .find(node => node.props.horizontal);

    renderer.act(() => {
      horizontalScroll.props.onLayout({nativeEvent: {layout: {width: 300}}});
      horizontalScroll.props.onContentSizeChange(600, 200);
      horizontalScroll.props.onScroll({nativeEvent: {contentOffset: {x: 120}}});
    });

    const scrolledStyles = [
      ...tree.root.findAllByType('View'),
      ...tree.root.findAllByType('TouchableOpacity'),
    ].map(node => flattenStyle(node.props.style));

    expect(scrolledStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({transform: [{translateX: 120}]}),
      ]),
    );
    expect(scrolledStyles).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({transform: [{translateX: -180}]}),
      ]),
    );
  });

  it('keeps the complete search aligned in the toolbar when there is enough room', () => {
    mockWindowDimensions = {width: 430, height: 932};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome', searchable: true}],
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          storeName: 'orders',
        }),
      );
    });

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(1);
    expect(tree.root.findAllByType('icon').map(node => node.props.name)).not.toContain('search');
  });

  it('hides the toolbar when the screen disables it', () => {
    mockWindowDimensions = {width: 430, height: 932};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome', searchable: true}],
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome', searchable: true}],
          data: [],
          showToolbar: false,
          storeName: 'orders',
        }),
      );
    });

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(0);
    expect(tree.root.findAllByType('icon').map(node => node.props.name)).not.toEqual(
      expect.arrayContaining(['columns', 'grid', 'list', 'search']),
    );
  });

  it('keeps add available as a floating button when the toolbar is hidden', () => {
    const onAdd = jest.fn();
    mockWindowDimensions = {width: 430, height: 932};
    mockStores.orders = {
      actions: {},
      getters: {
        add: true,
        columns: [{key: 'name', label: 'Nome', searchable: true}],
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome', searchable: true}],
          data: [],
          onAdd,
          showToolbar: false,
          storeName: 'orders',
        }),
      );
    });

    const addButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'plus'));

    expect(addButton).toBeTruthy();
    expect(addButton.props.accessibilityRole).toBe('button');
    expect(addButton.props.accessibilityLabel).toBe('Adicionar');

    renderer.act(() => addButton.props.onPress());

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('collapses search into an icon on narrow toolbars and opens the search modal', () => {
    mockWindowDimensions = {width: 375, height: 667};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome', searchable: true}],
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          storeName: 'orders',
        }),
      );
    });

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(0);
    const searchButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'search'));

    expect(searchButton.props.accessibilityRole).toBe('button');
    expect(searchButton.props.accessibilityLabel).toBe('Buscar');

    renderer.act(() => searchButton.props.onPress());

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(1);
    expect(tree.root.findByType('DefaultSearch').props.autoFocus).toBe(true);
  });

  it('gives collapsed search a stable accessible name without a placeholder', () => {
    mockWindowDimensions = {width: 375, height: 667};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome', searchable: true}],
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          storeName: 'orders',
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
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome', searchable: true}],
        totalItems: 27,
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          showTotalItemsInCompactToolbar: true,
          showTotalItemsInFooter: true,
          storeName: 'orders',
        }),
      );
    });

    const iconNames = tree.root.findAllByType('icon').map(node => node.props.name);

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(0);
    expect(iconNames).toEqual(expect.arrayContaining(['search', 'filter', 'list', 'columns']));
    expect(
      tree.root.findAllByType('Text').filter(node => node.props.children === '27 registros'),
    ).toHaveLength(1);
  });

  it('opens the filters modal with filterable columns only', () => {
    mockWindowDimensions = {width: 375, height: 667};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [
          {key: 'name', label: 'Nome'},
          {key: 'ignored', label: 'Ignorado', filter: false},
          {
            key: 'status',
            label: 'Status',
            list: [{value: 'pos', label: 'POS'}],
          },
        ],
        filters: {},
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          data: [],
          storeName: 'orders',
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
          storeName: 'orders',
        }),
      );
    });

    const filterButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'filter'));

    renderer.act(() => filterButton.props.onPress());

    const statusFilterProps = mockCapturedColumnFilterProps
      .find(props => props.column.key === 'status');

    renderer.act(() => {
      statusFilterProps.onChange('status', 'paid');
    });

    const statusHeader = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('Text').some(text => text.props.children === 'Status'));

    renderer.act(() => {
      statusHeader.props.onPress();
    });

    expect(setFilters).toHaveBeenCalledWith({status: 'paid'});
    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      orders: {
        OrderHistoryPage: {
          filters: {
            status: 'paid',
          },
          sort: {
            direction: 'asc',
            field: 'status',
          },
        },
      },
    });
  });

  it('hydrates the saved sort using a stable preference key on auto tables', async () => {
    const getItems = jest.fn(() => Promise.resolve([]));
    reactNavigation.useIsFocused.mockImplementation(() => true);
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        orders: {
          'order-history-page': {
            sort: {
              direction: 'desc',
              field: 'status',
            },
          },
        },
      }),
    );
    mockStores.orders = {
      actions: {
        getItems,
      },
      getters: {
        columns: [
          {key: 'status', label: 'Status', sortable: true},
          {key: 'price', label: 'Preco'},
        ],
        filters: {},
        items: [],
      },
    };

    await renderer.act(async () => {
      renderer.create(
        React.createElement(DefaultTable, {
          storeName: 'orders',
          visibleColumnsPreferenceKey: 'order-history-page',
        }),
      );
      await Promise.resolve();
    });

    expect(getItems).toHaveBeenCalledWith(
      expect.objectContaining({
        'order[status]': 'desc',
        itemsPerPage: 50,
        page: 1,
      }),
    );
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
    mockStores.orders = {
      actions: {},
      getters: {
        totalItems: 27,
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          showTotalItemsInCompactToolbar: true,
          showTotalItemsInFooter: false,
          storeName: 'orders',
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
      tree.update(React.createElement(DefaultTable, props));
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'list'}).parent.props.onPress();
      tree.update(React.createElement(DefaultTable, props));
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
    mockStores.orders = {
      actions: {},
      getters: {
        totalItems: 7,
      },
    };

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
          storeName: 'orders',
        }),
      );
    });

    const footer = tree.root.findByType('CustomFooter');

    expect(footer.props.resolvedTotalItemsText).toBe('7 registros');
  });

  it('keeps infinite scroll loading transparent over existing rows', () => {
    let tree;
    const getItems = jest.fn(() => Promise.resolve({member: []}));
    mockWindowDimensions = {width: 1024, height: 800};
    mockStores.invoices = {
      actions: {
        getItems,
      },
      getters: {
        columns: [{key: 'status', label: 'Situação'}],
        items: [{id: 332, status: 'Pago'}],
        totalItems: 1394,
      },
    };

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          showColumnFiltersButton: false,
          showRowActions: false,
          storeName: 'invoices',
        }),
      );
    });

    expect(tree.root.findAllByType('StateStore')).toHaveLength(0);
    const flatList = tree.root.findByType('FlatList');
    expect(flatList.props.onEndReachedThreshold).toBeGreaterThanOrEqual(0.75);
    expect(tree.root.findByType('ScrollView').props.contentContainerStyle).toEqual(
      expect.objectContaining({minWidth: '100%'}),
    );

    renderer.act(() => {
      flatList.props.onScroll({
        nativeEvent: {
          contentOffset: {y: 650},
          contentSize: {height: 1200},
          layoutMeasurement: {height: 400},
        },
      });
    });

    expect(getItems).toHaveBeenCalledWith(expect.objectContaining({append: true}));
  });

  it('uses the configured summary and labels before the store summary', () => {
    let tree;
    mockWindowDimensions = {width: 1024, height: 800};
    mockStores.invoice = {
      actions: {},
      getters: {
        summary: {
          financial: {
            paidAmount: 0,
          },
        },
        totalItems: 1,
      },
    };

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'status', label: 'Situação'}],
          data: [{id: 332, status: 'Pago'}],
          showColumnFiltersButton: false,
          showRowActions: false,
          storeName: 'invoice',
          summary: {
            financial: {
              paidAmount: 80.25,
            },
          },
          summaryLabels: {
            'financial.paidAmount': 'Valor pago',
          },
        }),
      );
    });

    const textValues = tree.root.findAllByType('Text').map(node => node.props.children);
    expect(textValues).toContain('Valor pago');
    expect(textValues).toContain('R$ 80,25');
  });

  it('opens a debug query modal when the store exposes debug.query', () => {
    mockWindowDimensions = {width: 1024, height: 800};
    mockStores.orders = {
      actions: {},
      getters: {
        columns: [{key: 'id', label: 'ID'}],
        debug: {
          interpolatedQuery: "SELECT * FROM orders WHERE provider_id = '2'",
          query: 'SELECT * FROM orders WHERE provider_id = 2',
        },
        filters: {
          provider: '/people/2',
        },
        items: [],
      },
    };

    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          requestParams: {itemsPerPage: 50},
          storeName: 'orders',
        }),
      );
    });

    const debugButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.props.accessibilityLabel === 'Debug query');

    expect(debugButton).toBeTruthy();

    renderer.act(() => debugButton.props.onPress());

    const textValues = tree.root.findAllByType('Text').map(node => node.props.children);
    expect(textValues).toContain('Debug query');
    expect(textValues).toContain('SELECT * FROM orders WHERE provider_id = 2');
    expect(textValues).toContain('Query preenchida');
    expect(textValues).toContain("SELECT * FROM orders WHERE provider_id = '2'");
    expect(textValues.some(value => String(value).includes('"provider": "/people/2"'))).toBe(true);
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
      [STORE_ACTION_META_KEY]: {
        savedItemPatch: {
          jobTitle: {
            id: 2,
            name: 'Departamento',
          },
        },
      },
    });
  });
});

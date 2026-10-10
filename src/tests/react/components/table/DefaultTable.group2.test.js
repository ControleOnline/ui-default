const {registerDefaultTableTests, React, renderer, mockState, DefaultTable, mergeSortedDataWithLiveItems, resolveColumnListLoadParams, shouldTriggerEndReachedFromScroll, DEFAULT_TABLE_PREFERENCES_STORAGE_KEY, reactNavigation, getAllStores, STORE_ACTION_META_KEY, flattenStyle} = require('./defaultTableTestSetup.cjs');
registerDefaultTableTests(() => {
it('gives collapsed search a stable accessible name without a placeholder', () => {
    mockState.windowDimensions = {width: 375, height: 667};
    mockState.stores.orders = {
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
    mockState.windowDimensions = {width: 375, height: 667};
    mockState.stores.orders = {
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
    mockState.windowDimensions = {width: 375, height: 667};
    mockState.stores.orders = {
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
    expect([...new Set(mockState.capturedColumnFilterProps.map(props => props.column.key))]).toEqual(['name', 'status']);
  });
it('persists filters and sort under default-table[store][route]', () => {
    const setFilters = jest.fn();
    mockState.windowDimensions = {width: 1024, height: 800};
    mockState.stores.orders = {
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

    const statusFilterProps = mockState.capturedColumnFilterProps
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
    ).toEqual({'1': {
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
    }});
  });
it('hydrates the saved sort using a stable preference key on auto tables', async () => {
    const getItems = jest.fn(() => Promise.resolve([]));
    reactNavigation.useIsFocused.mockImplementation(() => true);
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({'1': {
        orders: {
          'order-history-page': {
            sort: {
              direction: 'desc',
              field: 'status',
            },
          },
        },
      }}),
    );
    mockState.stores.orders = {
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
      JSON.stringify({'1': {
        product_showcase_items: {
          'product-showcases-page': {
            filters: {
              integration: 'pos',
            },
          },
        },
      }}),
    );
    mockState.stores.product_showcase_items = {
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
          visibleColumnsPreferenceKey: 'product-showcases-page',
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
          visibleColumnsPreferenceKey: 'product-showcases-page',
        }),
      );
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({'1': {
      product_showcase_items: {
        'product-showcases-page': {
          filters: {
            integration: 'ifood',
          },
        },
      },
    }});

    delete global.location;
  });
it('preserves the compact toolbar total when the footer total is disabled', () => {
    mockState.windowDimensions = {width: 375, height: 667};
    mockState.stores.orders = {
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

    mockState.windowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, props),
      );
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);

    mockState.windowDimensions = {width: 480, height: 800};

    renderer.act(() => {
      tree.update(React.createElement(DefaultTable, props));
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'list'}).parent.props.onPress();
      tree.update(React.createElement(DefaultTable, props));
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);
    expect(tree.root.findByProps({name: 'grid'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'grid'}).parent.props.onPress();
      tree.update(React.createElement(DefaultTable, props));
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();
  });
it('applies a custom rowStyle to rendered table rows', () => {
    let tree;
    const rowStyle = jest.fn(() => ({
      borderLeftColor: '#DC2626',
      borderLeftWidth: 4,
    }));

    mockState.windowDimensions = {width: 1024, height: 800};

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
    mockState.stores.orders = {actions: {save}, getters: {}};
    let tree;

    mockState.windowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          storeName: 'orders',
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
    const latestInput = () => mockState.capturedDefaultInputProps[mockState.capturedDefaultInputProps.length - 1];

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
});

const {registerDefaultTableTests, React, renderer, mockState, DefaultTable, mergeSortedDataWithLiveItems, resolveColumnListLoadParams, shouldTriggerEndReachedFromScroll, DEFAULT_TABLE_PREFERENCES_STORAGE_KEY, reactNavigation, getAllStores, STORE_ACTION_META_KEY, flattenStyle} = require('./defaultTableTestSetup.cjs');
registerDefaultTableTests(() => {
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

    const latestInput = () => mockState.capturedDefaultInputProps[mockState.capturedDefaultInputProps.length - 1];

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
it('protects both custom row action navigation callbacks during inline editing', () => {
  const onRowPress = jest.fn();
  mockState.windowDimensions = {width: 1024, height: 800};
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(DefaultTable, {
    columns: [{key: 'name', label: 'Nome', editable: true}],
    data: [{id: 1, name: 'Cliente'}], onRowPress,
    rowActionsComponent: props => React.createElement('CustomRowActions', props),
    showColumnFiltersButton: false,
  }));});
  const input = () => mockState.capturedDefaultInputProps.at(-1);
  renderer.act(() => {input().onStartEditing();});
  renderer.act(() => {
    const props = tree.root.findByType('CustomRowActions').props;
    props.openRow(); props.helpers.openRow();
  });
  expect(onRowPress).not.toHaveBeenCalled();
  renderer.act(() => {input().onCancelEditing();});
  renderer.act(() => {
    const props = tree.root.findByType('CustomRowActions').props;
    props.openRow(); props.helpers.openRow();
  });
  expect(onRowPress).toHaveBeenCalledTimes(2);
});
it('renders a custom footer component when provided', () => {
    let tree;
    mockState.stores.orders = {
      actions: {},
      getters: {
        totalItems: 7,
      },
    };

    const FooterComponent = props =>
      React.createElement('CustomFooter', {
        resolvedTotalItemsText: props.resolvedTotalItemsText,
      });

    mockState.windowDimensions = {width: 1024, height: 800};

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
    mockState.windowDimensions = {width: 1024, height: 800};
    mockState.stores.invoices = {
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
    mockState.windowDimensions = {width: 1024, height: 800};
    mockState.stores.invoice = {
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
    mockState.windowDimensions = {width: 1024, height: 800};
    mockState.stores.orders = {
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

    mockState.stores.employee_profiles = {
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

    expect(mockState.capturedDefaultInputProps.length).toBeGreaterThan(0);

    await renderer.act(async () => {
      await mockState.capturedDefaultInputProps[0].onSave({
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

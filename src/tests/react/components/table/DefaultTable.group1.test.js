const {registerDefaultTableTests, React, renderer, mockState, DefaultTable, mergeSortedDataWithLiveItems, resolveColumnListLoadParams, shouldTriggerEndReachedFromScroll, DEFAULT_TABLE_PREFERENCES_STORAGE_KEY, reactNavigation, getAllStores, STORE_ACTION_META_KEY, flattenStyle} = require('./defaultTableTestSetup.cjs');
registerDefaultTableTests(() => {
it('can show only search in the toolbar while hiding configured actions and controls', () => {
    mockState.windowDimensions = {width: 375, height: 667};
    mockState.stores.categories = {
      actions: {},
      getters: {
        columns: [{key: 'name', label: 'Nome', searchable: true}],
        configs: {
          import: {enabled: true, importType: 'product', label: 'Importar CSV'},
          showSearch: true,
        },
        items: [],
        totalItems: 17,
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome', searchable: true}],
          data: [],
          showToolbarActions: false,
          showToolbarControls: false,
          showTotalItemsInFooter: false,
          storeName: 'categories',
        }),
      );
    });

    const iconNames = tree.root.findAllByType('icon').map(node => node.props.name);
    expect(iconNames).toContain('search');
    expect(iconNames).not.toEqual(
      expect.arrayContaining(['upload', 'code', 'filter', 'list', 'columns']),
    );
    expect(tree.root.findAllByType('Text').map(node => node.props.children)).not.toContain('Importar CSV');
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

    expect(iconNames).toEqual(expect.arrayContaining(['list', 'columns']));
  });
it('respects the compact grid/list toggle in the table body', () => {
    mockState.windowDimensions = {width: 480, height: 800};
    mockState.stores.orders = {
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
    mockState.windowDimensions = {width: 1200, height: 800};
    mockState.stores.orders = {
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
        expect.objectContaining({position: 'sticky', left: 0}),
        expect.objectContaining({position: 'sticky', right: 0}),
      ]),
    );
  });
it('renders a custom row actions component with the configured actions width', () => {
    mockState.windowDimensions = {width: 1200, height: 800};
    mockState.stores.orders = {
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
    mockState.windowDimensions = {width: 1200, height: 800};
    mockState.stores.orders = {
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
        expect.objectContaining({position: 'sticky', left: 0}),
      ]),
    );
    expect(scrolledStyles).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({position: 'sticky', right: 0}),
      ]),
    );
  });
it('keeps the complete search aligned in the toolbar when there is enough room', () => {
    mockState.windowDimensions = {width: 430, height: 932};
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

    expect(tree.root.findAllByType('DefaultSearch')).toHaveLength(1);
    expect(tree.root.findAllByType('icon').map(node => node.props.name)).not.toContain('search');
  });
it('hides the toolbar when the screen disables it', () => {
    mockState.windowDimensions = {width: 430, height: 932};
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
    mockState.windowDimensions = {width: 430, height: 932};
    mockState.stores.orders = {
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
it('opens the default create form when add has no custom handler', () => {
    mockState.windowDimensions = {width: 430, height: 932};
    const save = jest.fn(() => Promise.resolve({id: 10}));
    mockState.stores.invoice = {
      actions: {save},
      getters: {
        add: true,
        columns: [{key: 'payer', label: 'Pagador', editable: true}],
      },
    };
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          requestParams: {receiver: 21},
          showToolbar: false,
          storeName: 'invoice',
        }),
      );
    });

    const addButton = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.findAllByType('icon').some(icon => icon.props.name === 'plus'));

    expect(tree.root.findAllByType('Modal').some(node => node.props.visible)).toBe(false);

    renderer.act(() => addButton.props.onPress());

    expect(tree.root.findAllByType('Modal').some(node => node.props.visible)).toBe(true);
    expect(mockState.capturedDefaultFormProps[mockState.capturedDefaultFormProps.length - 1]).toEqual(
      expect.objectContaining({
        actions: expect.objectContaining({save}),
        mode: 'create',
        row: {receiver: 21},
        storeName: 'invoice',
      }),
    );
  });
it('collapses search into an icon on narrow toolbars and opens the search modal', () => {
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
});

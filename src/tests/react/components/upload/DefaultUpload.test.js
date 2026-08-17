const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {describe, expect, it, beforeEach} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

const fileActions = {
  getItems: jest.fn(),
};

const relationActions = {
  save: jest.fn(),
  remove: jest.fn(),
};

jest.mock('@env', () => ({
  env: {
    API_ENTRYPOINT: 'https://api.controleonline.com',
    DOMAIN: 'manager.controleonline.com',
  },
}));

jest.mock('@store', () => ({
  useStore: jest.fn(name => {
    if (name === 'file') {
      return {
        actions: fileActions,
        getters: {},
      };
    }

    if (name === 'product_file' || name === 'category_file') {
      return {
        actions: relationActions,
        getters: {},
      };
    }

    return {
      actions: {},
      getters: {},
    };
  }),
}));

jest.mock(
  '@expo/vector-icons',
  () => ({
    MaterialCommunityIcons: props =>
      React.createElement('icon', props, props.children),
  }),
  {virtual: true},
);

jest.mock('react-native-vector-icons/Feather', () => props =>
  React.createElement('feathericon', props, props.children),
);

jest.mock('@controleonline/ui-common/src/react/components/AnimatedModal', () => {
  return props => (props.visible ? React.createElement('modal', props, props.children) : null);
});

jest.mock('@controleonline/ui-default/src/react/components/files/DefaultFile', () => {
  return props => React.createElement('defaultfile', props, props.children);
});

jest.mock('../../../../react/components/upload/fileUpload', () => ({
  selectFile: jest.fn(),
  uploadFileToApi: jest.fn(),
  toFileIri: jest.fn(),
  extractFileId: value => value?.id || value,
}));

jest.mock('react-native', () => ({
  ActivityIndicator: props => React.createElement('activityindicator', props, props.children),
  Platform: {OS: 'web'},
  ScrollView: props => React.createElement('scrollview', props, props.children),
  Text: props => React.createElement('text', props, props.children),
  TextInput: props => React.createElement('textinput', props, props.children),
  TouchableOpacity: props => React.createElement('touchableopacity', props, props.children),
  View: props => React.createElement('view', props, props.children),
}));

const {selectFile, uploadFileToApi, toFileIri} = require('../../../../react/components/upload/fileUpload');
const DefaultUpload = require('../../../../react/components/upload/DefaultUpload').default;

const flush = () => new Promise(resolve => setImmediate(resolve));

const collectText = node =>
  node
    .findAllByType('text')
    .map(textNode => {
      const children = textNode.props.children;
      if (Array.isArray(children)) {
        return children.flat(Infinity).join('');
      }
      return children || '';
    })
    .join('');

const findButtonByLabel = (root, label) =>
  root.findAllByType('touchableopacity').find(button => collectText(button).includes(label));

const findButtonByAccessibilityLabel = (root, label) =>
  root.findAllByType('touchableopacity').find(button => button.props.accessibilityLabel === label);

describe('DefaultUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('abre a biblioteca, carrega arquivos e envia um arquivo pelo helper centralizado', async () => {
    fileActions.getItems.mockResolvedValue({
      member: [
        {id: 10, fileName: 'Biblioteca 1', context: 'products', fileType: 'image'},
      ],
    });
    relationActions.save.mockResolvedValue({id: 42});
    selectFile.mockResolvedValue({
      name: 'nova-imagem.png',
      uri: 'file:///nova-imagem.png',
      mimeType: 'image/png',
    });
    uploadFileToApi.mockResolvedValue({id: 77, fileName: 'nova-imagem.png'});
    toFileIri.mockReturnValue('/files/77');

    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultUpload, {
          relationStoreName: 'product_file',
          relationField: 'product',
          relationResource: 'products',
          entityId: 12,
          companyId: 3,
          attachments: [{id: 1, file: {id: 1, fileName: 'Anexa'}}],
          context: 'products',
          title: 'Imagens anexas',
          triggerLabel: 'Gerenciar imagens',
          managerTitle: 'Gerenciador de imagens',
          searchPlaceholder: 'Buscar imagem',
          uploadButtonLabel: 'Enviar nova',
        }),
      );
    });

    await renderer.act(async () => {
      findButtonByLabel(tree.root, 'Gerenciar imagens').props.onPress();
      await flush();
    });

    expect(fileActions.getItems).toHaveBeenCalled();

    const uploadButton = findButtonByLabel(tree.root, 'Enviar nova');
    expect(uploadButton).toBeTruthy();

    await renderer.act(async () => {
      await uploadButton.props.onPress();
      await flush();
    });

    expect(selectFile).toHaveBeenCalledWith('image/*');
    expect(uploadFileToApi).toHaveBeenCalledWith({
      file: expect.objectContaining({name: 'nova-imagem.png'}),
      context: 'products',
      peopleId: 3,
      entityId: 12,
    });
    expect(relationActions.save).toHaveBeenCalledWith({
      product: '/products/12',
      file: '/files/77',
    });
  });

  it('permite que o pai gerencie upload anexado e remocao por contexto customizado', async () => {
    const onChanged = jest.fn();
    const onUploadFile = jest.fn().mockResolvedValue({id: 8, file: {id: 88}});
    const onRemoveAttachment = jest.fn().mockResolvedValue({});

    fileActions.getItems.mockResolvedValue({member: []});
    selectFile.mockResolvedValue({
      name: 'avatar.png',
      type: 'image/png',
    });

    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultUpload, {
          relationStoreName: 'people',
          relationField: 'people',
          relationResource: 'people',
          entityId: 30,
          companyId: 30,
          attachments: [{file: {id: 91, fileName: 'avatar.png'}}],
          context: 'people_media',
          libraryContexts: ['people_media'],
          title: 'avatar',
          triggerLabel: 'Gerenciar avatar',
          uploadButtonLabel: 'Enviar nova',
          onChanged,
          onUploadFile,
          onRemoveAttachment,
          uploadResultAlreadyAttached: true,
        }),
      );
    });

    await renderer.act(async () => {
      findButtonByLabel(tree.root, 'Gerenciar avatar').props.onPress();
      await flush();
    });

    await renderer.act(async () => {
      await findButtonByLabel(tree.root, 'Enviar nova').props.onPress();
      await flush();
    });

    expect(onUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'people_media',
        entityId: 30,
        file: expect.objectContaining({name: 'avatar.png'}),
      }),
    );
    expect(relationActions.save).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();

    const removeButton = findButtonByAccessibilityLabel(tree.root, 'Remover');
    expect(removeButton).toBeTruthy();

    await renderer.act(async () => {
      await removeButton.props.onPress();
      await flush();
    });

    expect(onRemoveAttachment).toHaveBeenCalledWith(
      expect.objectContaining({file: expect.objectContaining({id: 91})}),
    );
    expect(relationActions.remove).not.toHaveBeenCalled();
  });

  it('normaliza o identificador da relacao antes da remocao customizada', async () => {
    const onRemoveAttachment = jest.fn().mockResolvedValue({});

    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultUpload, {
          relationStoreName: 'people',
          relationField: 'people',
          relationResource: 'people',
          entityId: 30,
          companyId: 30,
          attachments: [{mediaId: '/people_media/44', file: {id: 91, fileName: 'avatar.png'}}],
          context: 'people_media',
          title: 'avatar',
          triggerLabel: 'Gerenciar avatar',
          onRemoveAttachment,
        }),
      );
    });

    await renderer.act(async () => {
      await findButtonByAccessibilityLabel(tree.root, 'Remover').props.onPress();
      await flush();
    });

    expect(onRemoveAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '44',
        mediaId: '/people_media/44',
        file: expect.objectContaining({id: 91}),
      }),
    );
  });

  it('renderiza apenas o gatilho customizado quando o conteudo inline fica desativado', async () => {
    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultUpload, {
          relationStoreName: 'people',
          relationField: 'people',
          relationResource: 'people',
          entityId: 30,
          companyId: 30,
          attachments: [{file: {id: 91, fileName: 'avatar.png'}}],
          context: 'people_media',
          title: 'avatar',
          showInlineContent: false,
          renderTrigger: ({openManager}) =>
            React.createElement(
              'touchableopacity',
              {onPress: openManager},
              React.createElement('text', null, 'Abrir gerenciador customizado'),
            ),
        }),
      );
    });

    expect(collectText(tree.root)).toContain('Abrir gerenciador customizado');
    expect(collectText(tree.root)).not.toContain('avatar.png');

    await renderer.act(async () => {
      findButtonByLabel(tree.root, 'Abrir gerenciador customizado').props.onPress();
      await flush();
    });

    expect(fileActions.getItems).toHaveBeenCalled();
  });
});

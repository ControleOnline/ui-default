import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useStore} from '@store';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import DefaultFile from '@controleonline/ui-default/src/react/components/files/DefaultFile';
import {selectFile, uploadFileToApi, toFileIri, extractFileId} from './fileUpload';
import {
  defaultUploadStyles as styles,
} from './DefaultUpload.styles';

const DEFAULT_LIBRARY_CONTEXTS = ['products', 'products-category'];

const normalizeCollection = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];
  return [];
};

const getEntityId = relation => {
  const value = relation?.id || relation?.['@id'] || relation;
  const match = String(value || '').match(/(\d+)$/);
  return match ? match[1] : null;
};

const getRelationFileId = relation => extractFileId(relation?.file);

const getFileName = file => {
  const id = extractFileId(file);
  return file?.fileName || file?.name || file?.originalName || (id ? `Arquivo ${id}` : 'Arquivo');
};

const getContextLabel = context => {
  if (!context) return 'sem contexto';
  return String(context).trim();
};

const dedupeFiles = files => {
  const seen = new Set();
  return files.filter(file => {
    const id = extractFileId(file);
    if (!id || seen.has(String(id))) return false;
    seen.add(String(id));
    return true;
  });
};

const DefaultUpload = ({
  relationStoreName,
  relationField,
  relationResource,
  attachments = [],
  entityId,
  companyId,
  context = 'products',
  libraryContexts = DEFAULT_LIBRARY_CONTEXTS,
  fileStoreName = 'file',
  onChanged,
  coverRelationId,
  onCoverChanged,
  title = 'Imagens anexas',
  triggerLabel = 'Gerenciar imagens',
  managerTitle = 'Gerenciador de imagens',
  searchPlaceholder = 'Buscar imagem',
  uploadButtonLabel = 'Enviar nova',
  loadingText = 'Carregando arquivos...',
  emptyAttachmentLabel = 'Nenhum arquivo anexado.',
  emptyLibraryLabel = 'Nenhum arquivo encontrado.',
  saveBeforeLabel = 'Salve o registro antes de anexar arquivos.',
  uploadSuccessMessage = 'Arquivo enviado e anexado.',
  attachSuccessMessage = 'Arquivo anexado com sucesso.',
  removeSuccessMessage = 'Arquivo removido.',
  attachedLabel = 'Anexado',
  fileType = 'image',
  acceptedTypes = 'image/*',
  fileTypeLabel = 'arquivo',
  onBeforeOpen = null,
  onUploadFile = null,
  onAttachFile = null,
  onRemoveAttachment = null,
  renderTrigger = null,
  requireEntity = true,
  showInlineContent = true,
  uploadResultAlreadyAttached = false,
}) => {
  const relationStore = useStore(relationStoreName);
  const fileStore = useStore(fileStoreName);
  const themeStore = useStore('theme');
  const relationActions = relationStore?.actions || {};
  const fileActions = fileStore?.actions || {};
  const themeColors = themeStore?.getters?.colors || {};

  const buttonPalette = useMemo(
    () => ({
      buttonBackground: themeColors.buttonBackground,
      buttonBorder: themeColors.buttonBorder,
      buttonText: themeColors.buttonText,
      buttonIcon: themeColors.buttonIcon || themeColors.buttonText,
      buttonBackgroundSecondary: themeColors.buttonBackgroundSecondary,
      buttonBorderSecondary: themeColors.buttonBorderSecondary,
      buttonTextSecondary: themeColors.buttonTextSecondary,
      buttonIconSecondary: themeColors.buttonIconSecondary || themeColors.buttonTextSecondary,
      iconSuccess: themeColors.iconSuccess,
      iconDanger: themeColors.iconDanger,
      textDanger: themeColors.textDanger,
    }),
    [
      themeColors.buttonBackground,
      themeColors.buttonBackgroundSecondary,
      themeColors.buttonBorder,
      themeColors.buttonBorderSecondary,
      themeColors.buttonIcon,
      themeColors.buttonIconSecondary,
      themeColors.buttonText,
      themeColors.buttonTextSecondary,
      themeColors.iconDanger,
      themeColors.iconSuccess,
      themeColors.textDanger,
    ],
  );

  const attachmentRows = Array.isArray(attachments) ? attachments : [];
  const libraryContextList = useMemo(
    () => (Array.isArray(libraryContexts) ? libraryContexts : [libraryContexts]).filter(Boolean),
    [libraryContexts],
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [coverId, setCoverId] = useState(coverRelationId || null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [savingFileId, setSavingFileId] = useState(null);

  const sortedAttachments = useMemo(() => {
    if (!coverId) return attachmentRows;
    const index = attachmentRows.findIndex(item => String(item.id) === String(coverId));
    if (index < 0) return attachmentRows;
    const copy = [...attachmentRows];
    const [selected] = copy.splice(index, 1);
    copy.unshift(selected);
    return copy;
  }, [attachmentRows, coverId]);

  const attachedFileIds = useMemo(
    () =>
      new Set(
        attachmentRows
          .map(getRelationFileId)
          .filter(Boolean)
          .map(String),
      ),
    [attachmentRows],
  );

  const filteredLibraryFiles = useMemo(() => {
    const query = String(librarySearch || '').trim().toLowerCase();
    if (!query) return libraryFiles;

    return libraryFiles.filter(file => {
      const name = getFileName(file).toLowerCase();
      const fileContext = String(file?.context || '').toLowerCase();
      const type = String(file?.fileType || '').toLowerCase();
      const label = String(fileTypeLabel || '').toLowerCase();
      return (
        name.includes(query) ||
        fileContext.includes(query) ||
        type.includes(query) ||
        label.includes(query)
      );
    });
  }, [fileTypeLabel, libraryFiles, librarySearch]);

  useEffect(() => {
    setCoverId(coverRelationId || null);
  }, [coverRelationId]);

  const loadLibrary = useCallback(async () => {
    if (typeof fileActions.getItems !== 'function') {
      setLibraryFiles([]);
      return;
    }

    setLibraryLoading(true);
    setLibraryError('');

    const peopleIri = getEntityId(companyId) ? `/people/${getEntityId(companyId)}` : null;

    try {
      const pageSize = 500;
      const maxPages = 10;

      const fetchContextFiles = async fileContext => {
        const contextFiles = [];

        for (let page = 1; page <= maxPages; page += 1) {
          const params = {
            context: fileContext,
            page,
            'order[fileName]': 'ASC',
          };

          if (fileType) params.fileType = fileType;
          if (peopleIri) params.people = peopleIri;

          const response = await fileActions.getItems(params);
          const pageItems = normalizeCollection(response);
          contextFiles.push(...pageItems);

          if (pageItems.length < pageSize) break;
        }

        return contextFiles;
      };

      const responses = await Promise.all(
        libraryContextList.map(fileContext => fetchContextFiles(fileContext).catch(fetchError => ({fetchError}))),
      );

      const files = responses
        .filter(response => !response?.fetchError)
        .flatMap(normalizeCollection)
        .filter(file => {
          if (!fileType) return true;
          return !file?.fileType || String(file.fileType).toLowerCase() === String(fileType).toLowerCase();
        });

      const firstError = responses.find(response => response?.fetchError)?.fetchError;
      if (files.length === 0 && firstError) throw firstError;

      setLibraryFiles(dedupeFiles(files));
    } catch (e) {
      setLibraryFiles([]);
      setLibraryError(e?.message || 'Falha ao carregar arquivos.');
    } finally {
      setLibraryLoading(false);
    }
  }, [companyId, fileActions, fileType, libraryContextList]);

  useEffect(() => {
    if (managerOpen) {
      if (typeof onBeforeOpen === 'function') {
        onBeforeOpen();
      }

      void loadLibrary();
    }
  }, [loadLibrary, managerOpen, onBeforeOpen]);

  const attachFileToEntity = useCallback(
    async (fileObj, options = {}) => {
      const {successMessage = attachSuccessMessage, closeManager = false} = options;
      setError('');
      setStatus('');

      if (requireEntity && !entityId) {
        setError(saveBeforeLabel);
        return null;
      }

      const fileIri = toFileIri(fileObj);
      if (!fileIri) throw new Error('Arquivo sem identificador.');

      const fileId = extractFileId(fileObj);
      if (fileId && attachedFileIds.has(String(fileId))) {
        setStatus('Arquivo ja anexado.');
        return null;
      }

      if (typeof onAttachFile === 'function') {
        const savedRelation = await onAttachFile(fileObj);

        setStatus(successMessage);
        if (onChanged) await onChanged();
        if (closeManager) setManagerOpen(false);
        return savedRelation;
      }

      if (typeof relationActions.save !== 'function') {
        throw new Error('Fluxo de vinculo indisponivel.');
      }

      try {
        const savedRelation = await relationActions.save({
          [relationField]: `/${relationResource}/${entityId}`,
          file: fileIri,
        });

        setStatus(successMessage);
        if (onChanged) await onChanged();
        if (closeManager) setManagerOpen(false);
        return savedRelation;
      } catch (e) {
        const message = String(e?.message || e?.response?.data?.detail || '');
        if (/unique|duplicate|duplic/i.test(message)) {
          setStatus('Arquivo ja anexado.');
          if (onChanged) await onChanged();
          return null;
        }

        throw e;
      }
    },
    [
      attachSuccessMessage,
      attachedFileIds,
      entityId,
      onChanged,
      relationActions,
      relationField,
      relationResource,
      saveBeforeLabel,
      onAttachFile,
      requireEntity,
    ],
  );

  const handleUpload = useCallback(async () => {
    setError('');
    setStatus('');

    if (requireEntity && !entityId) {
      setError(saveBeforeLabel);
      return;
    }

    const file = await selectFile(acceptedTypes);
    if (!file) return;

    try {
      setUploading(true);
      const uploadedFile =
        typeof onUploadFile === 'function'
          ? await onUploadFile({
              acceptedTypes,
              companyId,
              context,
              entityId,
              file,
            })
          : await uploadFileToApi({
              file,
              context,
              peopleId: companyId,
              entityId,
            });

      if (uploadResultAlreadyAttached) {
        setStatus(uploadSuccessMessage);
        if (onChanged) await onChanged();
        await loadLibrary();
        return;
      }

      await attachFileToEntity(uploadedFile, {
        successMessage: uploadSuccessMessage,
      });

      await loadLibrary();
    } catch (e) {
      setError(e?.message || 'Falha ao anexar arquivo.');
    } finally {
      setUploading(false);
    }
  }, [
    acceptedTypes,
    attachFileToEntity,
    companyId,
    context,
    entityId,
    loadLibrary,
    onChanged,
    onUploadFile,
    requireEntity,
    saveBeforeLabel,
    uploadSuccessMessage,
    uploadResultAlreadyAttached,
  ]);

  const handleAttachExisting = useCallback(
    async file => {
      const fileId = extractFileId(file) || getFileName(file);
      try {
        setSavingFileId(fileId);
        await attachFileToEntity(file, {
          successMessage: attachSuccessMessage,
          closeManager: true,
        });
      } catch (e) {
        setError(e?.message || 'Falha ao anexar arquivo.');
      } finally {
        setSavingFileId(null);
      }
    },
    [attachFileToEntity, attachSuccessMessage],
  );

  const handleRemove = useCallback(
    async relation => {
      try {
        setError('');
        setStatus('');
        if (typeof onRemoveAttachment === 'function') {
          await onRemoveAttachment(relation);
          const relationId = getEntityId(relation);
          if (String(coverId) === String(relationId)) setCoverId(null);
          setStatus(removeSuccessMessage);
          if (onChanged) await onChanged();
          return;
        }

        const relationId = getEntityId(relation);
        if (!relationId) throw new Error('Anexo sem identificador para remocao.');

        if (typeof relationActions.remove !== 'function') {
          throw new Error('Fluxo de remocao indisponivel.');
        }
        await relationActions.remove(relationId);
        if (String(coverId) === String(relationId)) setCoverId(null);
        setStatus(removeSuccessMessage);
        if (onChanged) await onChanged();
      } catch (e) {
        setError(e?.message || 'Falha ao remover arquivo.');
      }
    },
    [coverId, onChanged, onRemoveAttachment, relationActions, removeSuccessMessage],
  );

  const handleSetCover = useCallback(
    async row => {
      setCoverId(row.id);
      if (onCoverChanged) {
        await onCoverChanged(row);
      }
    },
    [onCoverChanged],
  );

  const openManager = () => setManagerOpen(true);
  const triggerContent =
    typeof renderTrigger === 'function'
      ? renderTrigger({
          disabled: uploading,
          openManager,
          uploading,
        })
      : (
        <TouchableOpacity
          onPress={openManager}
          disabled={uploading}
          style={[
            styles.attachmentsTrigger,
            {
              backgroundColor: buttonPalette.buttonBackground,
              borderColor: buttonPalette.buttonBorder,
              borderWidth: 1,
            },
            uploading && styles.disabledButton,
          ]}>
          <View style={styles.headerButtonContent}>
            <MaterialCommunityIcons name="folder-image" size={16} color={buttonPalette.buttonIcon} />
            <Text style={[styles.attachmentsTriggerText, {color: buttonPalette.buttonText}]}>{uploading ? 'Enviando...' : triggerLabel}</Text>
          </View>
        </TouchableOpacity>
      );

  const managerModal = (
    <AnimatedModal visible={managerOpen} onRequestClose={() => setManagerOpen(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>{managerTitle}</Text>
            <Text style={styles.modalSubtitle}>{context}</Text>
          </View>
          <TouchableOpacity onPress={() => setManagerOpen(false)} style={styles.iconButton}>
            <MaterialCommunityIcons name="close" size={22} color={buttonPalette.buttonIconSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
            <TextInput
              value={librarySearch}
              onChangeText={setLibrarySearch}
              placeholder={searchPlaceholder}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {!!librarySearch && (
              <TouchableOpacity onPress={() => setLibrarySearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            style={[
              styles.uploadButton,
              {
                backgroundColor: buttonPalette.buttonBackground,
                borderColor: buttonPalette.buttonBorder,
                borderWidth: 1,
              },
              uploading && styles.disabledButton,
            ]}>
            {uploading ? (
              <ActivityIndicator size="small" color={buttonPalette.buttonIcon} />
            ) : (
              <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={buttonPalette.buttonIcon} />
            )}
            <Text style={[styles.uploadButtonText, {color: buttonPalette.buttonText}]}>
              {uploading ? 'Enviando' : uploadButtonLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={loadLibrary}
            disabled={libraryLoading}
            style={[
              styles.refreshButton,
              {
                backgroundColor: buttonPalette.buttonBackgroundSecondary,
                borderColor: buttonPalette.buttonBorderSecondary,
              },
            ]}>
            <MaterialCommunityIcons name="refresh" size={19} color={buttonPalette.buttonIconSecondary} />
          </TouchableOpacity>
        </View>

        {!!libraryError && <Text style={styles.modalError}>{libraryError}</Text>}

        {libraryLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#0F172A" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        ) : filteredLibraryFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={34} color="#CBD5E1" />
            <Text style={styles.emptyText}>{emptyLibraryLabel}</Text>
          </View>
        ) : (
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            <View style={styles.libraryGrid}>
              {filteredLibraryFiles.map(file => {
                const fileId = extractFileId(file);
                const isAttached = fileId && attachedFileIds.has(String(fileId));
                const isSaving = String(savingFileId || '') === String(fileId || getFileName(file));

                return (
                  <TouchableOpacity
                    key={fileId || file?.['@id'] || getFileName(file)}
                    style={[styles.fileCard, isAttached && styles.fileCardAttached]}
                    activeOpacity={0.82}
                    disabled={isSaving || isAttached}
                    onPress={() => handleAttachExisting(file)}
                  >
                    <View style={styles.fileThumb}>
                      <DefaultFile file={file} resizeMode="cover" style={styles.fileImage} />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={2}>
                        {getFileName(file)}
                      </Text>
                      <View style={styles.fileMetaRow}>
                        <Text style={styles.contextBadge}>{getContextLabel(file?.context)}</Text>
                        {isAttached && <Text style={styles.attachedBadge}>{attachedLabel}</Text>}
                      </View>
                    </View>
                    <View style={styles.fileAction}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <MaterialCommunityIcons
                          name={isAttached ? 'check-circle' : 'plus-circle-outline'}
                          size={22}
                          color={isAttached ? buttonPalette.iconSuccess : buttonPalette.buttonIconSecondary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </AnimatedModal>
  );

  if (!showInlineContent) {
    return (
      <View>
        {triggerContent}
        {managerModal}
      </View>
    );
  }

  return (
    <View style={styles.attachmentsTitleRow}>
      <View style={styles.attachmentsHeader}>
        <Text style={styles.attachmentsTitle}>{title}</Text>
        {triggerContent}
      </View>

      {!!status && <Text style={styles.attachmentsStatus}>{status}</Text>}
      {!!error && <Text style={styles.attachmentsError}>{error}</Text>}

      {sortedAttachments.length === 0 ? (
        <View style={styles.attachmentsEmpty}>
          <Text style={styles.attachmentsEmptyText}>{emptyAttachmentLabel}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.attachmentsList}>
            {sortedAttachments.map((row, index) => {
              const file = row?.file || row;
              return (
                <View key={row.id || file?.id || index} style={styles.attachmentCard}>
                  <View style={styles.attachmentThumb}>
                    <DefaultFile file={file} resizeMode="cover" style={styles.attachmentImage} />
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSetCover(row)}
                    style={{
                      backgroundColor:
                        String(coverId) === String(row.id)
                          ? buttonPalette.buttonBackground
                          : buttonPalette.buttonBackgroundSecondary,
                      borderColor:
                        String(coverId) === String(row.id)
                          ? buttonPalette.buttonBorder
                          : buttonPalette.buttonBorderSecondary,
                      borderWidth: 1,
                      paddingVertical: 6,
                      borderRadius: 4,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        color:
                          String(coverId) === String(row.id)
                            ? buttonPalette.buttonText
                            : buttonPalette.buttonTextSecondary,
                        fontSize: 12,
                      }}
                    >
                      {String(coverId) === String(row.id) ? 'Capa selecionada' : 'Definir como capa'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemove(row)}
                    style={[
                      styles.attachmentRemoveButton,
                      {
                        backgroundColor: buttonPalette.buttonBackgroundSecondary,
                        borderColor: buttonPalette.buttonBorderSecondary,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text style={[styles.attachmentRemoveText, {color: buttonPalette.textDanger}]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {managerModal}
    </View>
  );
};

export default DefaultUpload;

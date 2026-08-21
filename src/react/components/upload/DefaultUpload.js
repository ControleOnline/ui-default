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
import DefaultUploadAttachmentsList from './DefaultUploadAttachmentsList';
import DefaultUploadManagerModal from './DefaultUploadManagerModal';
import {defaultUploadStyles as styles} from './DefaultUpload.styles';
import {selectFile, uploadFileToApi, toFileIri, extractFileId} from './fileUpload';
import {
  DEFAULT_LIBRARY_CONTEXTS,
  normalizeCollection,
  getEntityId,
  normalizeAttachmentRelation,
  getRelationFileId,
  getFileName,
  getContextLabel,
  dedupeFiles,
} from './defaultUploadHelpers';
import {fetchLibraryFiles} from './defaultUploadLibrary';

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
      iconActive: themeColors.iconActive,
      textDanger: themeColors.textDanger,
      cardBackground: themeColors.cardBackground,
      cardBorder: themeColors.cardBorder,
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
      themeColors.iconActive,
      themeColors.iconDanger,
      themeColors.iconSuccess,
      themeColors.textDanger,
      themeColors.cardBackground,
      themeColors.cardBorder,
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

  // people_media library enrichment (#433): use people store actions when available
  const peopleActionsForLibrary =
    relationStoreName === 'people' && typeof relationActions?.getPeopleMedia === 'function'
      ? relationActions
      : null;

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryError('');
    try {
      const files = await fetchLibraryFiles({
        fileActions,
        companyId,
        fileType,
        libraryContexts: libraryContexts || DEFAULT_LIBRARY_CONTEXTS,
        peopleActions: peopleActionsForLibrary,
      });
      setLibraryFiles(files);
    } catch (e) {
      setLibraryError(e?.message || 'Falha ao carregar biblioteca de arquivos.');
      setLibraryFiles([]);
    } finally {
      setLibraryLoading(false);
    }
  }, [companyId, fileActions, fileType, libraryContexts, peopleActionsForLibrary]);


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
        const attachmentRelation = normalizeAttachmentRelation(relation);
        if (typeof onRemoveAttachment === 'function') {
          await onRemoveAttachment(attachmentRelation);
          const relationId = getEntityId(attachmentRelation);
          if (String(coverId) === String(relationId)) setCoverId(null);
          setStatus(removeSuccessMessage);
          if (onChanged) await onChanged();
          return;
        }

        const relationId = getEntityId(attachmentRelation);
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
    <DefaultUploadManagerModal
      visible={managerOpen}
      onClose={() => setManagerOpen(false)}
      managerTitle={managerTitle}
      context={context}
      buttonPalette={buttonPalette}
      librarySearch={librarySearch}
      setLibrarySearch={setLibrarySearch}
      searchPlaceholder={searchPlaceholder}
      handleUpload={handleUpload}
      uploading={uploading}
      uploadButtonLabel={uploadButtonLabel}
      libraryLoading={libraryLoading}
      loadLibrary={loadLibrary}
      attachLabel={attachedLabel}
      savingFileId={savingFileId}
      loadingText={loadingText}
      libraryError={libraryError}
      filteredLibraryFiles={filteredLibraryFiles}
      attachedFileIds={attachedFileIds}
      handleAttachExisting={handleAttachExisting}
      attachmentRows={attachmentRows}
      sortedAttachments={sortedAttachments}
      coverId={coverId}
      handleSetCover={handleSetCover}
      handleRemove={handleRemove}
      emptyLibraryLabel={emptyLibraryLabel}
      emptyAttachmentsLabel={emptyAttachmentLabel}
      status={status}
      error={error}
    />
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
    <DefaultUploadAttachmentsList
      title={title}
      triggerContent={triggerContent}
      status={status}
      error={error}
      sortedAttachments={sortedAttachments}
      emptyAttachmentLabel={emptyAttachmentLabel}
      coverId={coverId}
      handleSetCover={handleSetCover}
      handleRemove={handleRemove}
      buttonPalette={buttonPalette}
      managerModal={managerModal}
    />
  );
};

export default DefaultUpload;

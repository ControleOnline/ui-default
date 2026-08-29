import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import DefaultFile from '@controleonline/ui-default/src/react/components/files/DefaultFile';
import {extractFileId} from './fileUpload';
import {
  getFileName,
  getFileExtension,
  getContextLabel,
  isPreviewableImage,
  getGenericFileIcon,
} from './defaultUploadHelpers';
import {defaultUploadStyles as styles} from './DefaultUpload.styles';

function FileThumb({file}) {
  if (isPreviewableImage(file)) {
    return <DefaultFile file={file} resizeMode="cover" style={styles.fileImage} />;
  }
  const ext = getFileExtension(file);
  return (
    <View style={styles.fileThumbFallback}>
      <MaterialCommunityIcons name={getGenericFileIcon(file)} size={36} color="#475569" />
      <Text style={styles.fileExtBadge}>{ext ? ext.toUpperCase() : 'FILE'}</Text>
    </View>
  );
}

export default function DefaultUploadManagerModal(props) {
  const {
    visible,
    onClose,
    managerTitle,
    context,
    buttonPalette,
    librarySearch,
    setLibrarySearch,
    searchPlaceholder,
    handleUpload,
    uploading,
    uploadButtonLabel,
    libraryLoading,
    loadLibrary,
    attachLabel,
    savingFileId,
    loadingText,
    libraryError,
    filteredLibraryFiles,
    attachedFileIds,
    handleAttachExisting,
    attachmentRows,
    emptyLibraryLabel,
    emptyAttachmentsLabel,
    status,
    error,
  } = props;

  return (
    <AnimatedModal visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>{managerTitle}</Text>
            <Text style={styles.modalSubtitle}>{context}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
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
              {backgroundColor: buttonPalette.buttonBackground, borderColor: buttonPalette.buttonBorder, borderWidth: 1},
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
              {backgroundColor: buttonPalette.buttonBackgroundSecondary, borderColor: buttonPalette.buttonBorderSecondary},
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
                  <View key={fileId || getFileName(file)} style={[styles.fileCard, isAttached && styles.fileCardAttached]}>
                    <View style={styles.fileThumb}>
                      <FileThumb file={file} />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAttachExisting(file)}
                      disabled={isAttached || isSaving}
                      style={styles.fileAction}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <MaterialCommunityIcons
                          name={isAttached ? 'check' : 'plus'}
                          size={18}
                          color={isAttached ? '#15803D' : '#0F172A'}
                        />
                      )}
                    </TouchableOpacity>
                    <View style={styles.fileInfo}>
                      <Text numberOfLines={2} style={styles.fileName}>{getFileName(file)}</Text>
                      <View style={styles.fileMetaRow}>
                        <Text style={styles.contextBadge}>{getContextLabel(file?.context ?? file)}</Text>
                        {isAttached && <Text style={styles.attachedBadge}>{attachLabel}</Text>}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {attachmentRows.length === 0 && (
          <Text style={styles.emptyText}>{emptyAttachmentsLabel}</Text>
        )}
        {!!status && <Text style={styles.attachmentsStatus}>{status}</Text>}
        {!!error && <Text style={styles.attachmentsError}>{error}</Text>}
      </View>
    </AnimatedModal>
  );
}

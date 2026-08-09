import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import {extractFileId} from './fileUpload';
import {getFileName, getContextLabel} from './defaultUploadHelpers';
import styles from './DefaultUpload.styles';

/** File manager modal for DefaultUpload (app-community#296 modularization). */
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
    sortedAttachments,
    coverId,
    handleSetCover,
    handleRemove,
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
  );
}

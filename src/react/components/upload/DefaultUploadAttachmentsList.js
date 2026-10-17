import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import DefaultFile from '@controleonline/ui-default/src/react/components/files/DefaultFile';
import {extractFileId} from './fileUpload';
import {defaultUploadStyles as styles} from './DefaultUpload.styles';

/** Inline attachment cards for DefaultUpload (app-community#296 / #385). */
export default function DefaultUploadAttachmentsList({
  title,
  triggerContent,
  status,
  error,
  sortedAttachments,
  emptyAttachmentLabel,
  coverId,
  handleSetCover,
  handleRemove,
  buttonPalette,
  managerModal,
  company = null,
  showAttachmentActions = true,
}) {
  const iconDanger =
    buttonPalette?.iconDanger ||
    buttonPalette?.textDanger ||
    '#B91C1C';
  const iconActive =
    buttonPalette?.iconActive ||
    buttonPalette?.buttonBackground ||
    '#0F172A';
  const iconIdle =
    buttonPalette?.buttonIcon ||
    buttonPalette?.buttonTextSecondary ||
    '#64748B';
  const actionBg =
    buttonPalette?.buttonBackgroundSecondary ||
    buttonPalette?.cardBackground ||
    '#F8FAFC';
  const actionBorder =
    buttonPalette?.buttonBorderSecondary ||
    buttonPalette?.cardBorder ||
    '#E2E8F0';

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
              // people_media rows must use nested file only — never the relation as file
              // (relation id would be mistaken for file id and break the preview).
              const rawFile = row?.file;
              const fileId = extractFileId(rawFile);
              const file =
                rawFile && typeof rawFile === 'object' && !Array.isArray(rawFile)
                  ? rawFile
                  : fileId
                    ? {id: fileId, '@id': `/files/${fileId}`}
                    : null;
              const isCover = String(coverId) === String(row.id);
              return (
                <View
                  key={row.id || fileId || index}
                  style={styles.attachmentCard}>
                  <View style={styles.attachmentThumb}>
                    {file ? (
                      <DefaultFile
                        file={file}
                        company={company}
                        resizeMode="cover"
                        style={styles.attachmentImage}
                      />
                    ) : null}
                  </View>
                  {showAttachmentActions ? (
                    <View style={styles.attachmentActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleSetCover(row)}
                        accessibilityLabel={
                          isCover ? 'Capa selecionada' : 'Definir como capa'
                        }
                        style={[
                          styles.attachmentIconButton,
                          {
                            backgroundColor: actionBg,
                            borderColor: isCover ? iconActive : actionBorder,
                            borderWidth: 1,
                          },
                        ]}>
                        <FeatherIcon
                          name="star"
                          size={16}
                          color={isCover ? iconActive : iconIdle}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemove(row)}
                        accessibilityLabel="Remover"
                        style={[
                          styles.attachmentIconButton,
                          {
                            backgroundColor: actionBg,
                            borderColor: actionBorder,
                            borderWidth: 1,
                          },
                        ]}>
                        <FeatherIcon
                          name="trash-2"
                          size={16}
                          color={iconDanger}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {managerModal}
    </View>
  );
}

import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import DefaultFile from '@controleonline/ui-default/src/react/components/files/DefaultFile';
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
              const file = row?.file || row;
              const isCover = String(coverId) === String(row.id);
              return (
                <View
                  key={row.id || file?.id || index}
                  style={styles.attachmentCard}>
                  <View style={styles.attachmentThumb}>
                    <DefaultFile
                      file={file}
                      resizeMode="cover"
                      style={styles.attachmentImage}
                    />
                  </View>
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

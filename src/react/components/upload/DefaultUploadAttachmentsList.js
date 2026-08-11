import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import DefaultFile from '@controleonline/ui-default/src/react/components/DefaultFile';
import styles from './DefaultUpload.styles';

/** Inline attachment cards for DefaultUpload (app-community#296). */
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
                <View key={row.id || file?.id || index} style={styles.attachmentCard}>
                  <View style={styles.attachmentThumb}>
                    <DefaultFile file={file} resizeMode="cover" style={styles.attachmentImage} />
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSetCover(row)}
                    style={{
                      backgroundColor: isCover
                        ? buttonPalette.buttonBackground
                        : buttonPalette.buttonBackgroundSecondary,
                      borderColor: isCover
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
                        color: isCover
                          ? buttonPalette.buttonText
                          : buttonPalette.buttonTextSecondary,
                        fontSize: 12,
                      }}
                    >
                      {isCover ? 'Capa selecionada' : 'Definir como capa'}
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
                    <Text style={[styles.attachmentRemoveText, {color: buttonPalette.textDanger}]}>
                      Remover
                    </Text>
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
}

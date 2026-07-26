import React, { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { normalizeText } from '../inputs/defaultInputUtils';
import styles from './DefaultTable.styles';
import useDefaultTableTheme from './useDefaultTableTheme';

const isObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const formatDebugValue = value => {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return normalizeText(value);
  }
};

const copyTextToClipboard = async text => {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return false;

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(normalizedText);
    return true;
  }

  return false;
};

const DebugCopyButton = ({ borderColor, color, onPress }) => (
  <TouchableOpacity
    style={[styles.debugCopyButton, { borderColor }]}
    activeOpacity={0.82}
    onPress={onPress}
  >
    <Icon name="copy" size={13} color={color} />
    <Text style={[styles.debugCopyButtonText, { color }]}>Copiar</Text>
  </TouchableOpacity>
);

const DebugSection = ({ borderColor, children, copyText, onCopy, textColor, title }) => (
  <>
    <View style={styles.debugSectionHeader}>
      <Text style={[styles.debugSectionTitle, { color: textColor }]}>{title}</Text>
      <DebugCopyButton
        borderColor={borderColor}
        color={textColor}
        onPress={() => onCopy(copyText)}
      />
    </View>
    <Text selectable style={[styles.debugCodeBlock, { color: textColor, borderColor }]}>
      {children}
    </Text>
  </>
);

const DefaultDebug = ({
  storeName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const { showError, showSuccess } = useMessage() || {};
  const { modalColors, resolvedAccentColor, tableButtonColors } = useDefaultTableTheme();

  const resolvedDebug = isObject(store?.getters?.debug) ? store.getters.debug : {};
  const debugQuery = normalizeText(resolvedDebug?.query);
  const debugFilledQuery = normalizeText(
    resolvedDebug?.filledQuery || resolvedDebug?.interpolatedQuery,
  );
  const hasDebugQuery = debugQuery !== '';
  const debugParameters = isObject(resolvedDebug?.parameters)
    ? resolvedDebug.parameters
    : configs.debugFallbackParameters || null;
  const debugParametersText = useMemo(
    () => formatDebugValue(debugParameters),
    [debugParameters],
  );
  const debugCopyText = useMemo(
    () =>
      [
        'Query:',
        debugQuery,
        '',
        'Parameters:',
        debugParametersText,
        '',
        'Filled query:',
        debugFilledQuery,
      ].join('\n'),
    [debugFilledQuery, debugParametersText, debugQuery],
  );

  const requestCopyText = useCallback(
    text =>
      copyTextToClipboard(text)
        .then(copied => {
          if (copied) {
            showSuccess?.('Copiado');
            return;
          }

          showError?.('Nao foi possivel copiar automaticamente.');
        })
        .catch(() => {
          showError?.('Nao foi possivel copiar automaticamente.');
        }),
    [showError, showSuccess],
  );

  if (!hasDebugQuery) {
    return null;
  }

  const {
    backgroundColor,
    borderColor,
    closeIconColor,
    headerTextColor,
    overlayColor,
    textColor,
  } = modalColors;
  const {
    backgroundColor: buttonBackgroundColor,
    borderColor: buttonBorderColor,
    iconColor,
    pressedBackgroundColor,
    pressedBorderColor,
    pressedIconColor,
    textColor: buttonTextColor,
  } = tableButtonColors;

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Debug query"
        accessibilityRole="button"
        style={[
          styles.toolbarButton,
          { borderColor: buttonBorderColor, backgroundColor: buttonBackgroundColor },
          isOpen
            ? { backgroundColor: pressedBackgroundColor, borderColor: pressedBorderColor }
            : null,
        ]}
        activeOpacity={0.82}
        onPress={() => setIsOpen(true)}
      >
        <Icon name="code" size={14} color={buttonTextColor} />
      </TouchableOpacity>

      {isOpen ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
            <View style={[styles.modalCard, styles.debugModalCard, { borderColor, backgroundColor }]}>
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.modalTitle, { color: headerTextColor }]} numberOfLines={1}>
                  Debug query
                </Text>
                <TouchableOpacity
                  style={[styles.modalCloseButton, { borderColor, backgroundColor }]}
                  activeOpacity={0.82}
                  onPress={() => setIsOpen(false)}
                >
                  <Icon name="x" size={16} color={closeIconColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.debugModalBody} contentContainerStyle={styles.debugModalContent}>
                <DebugSection
                  borderColor={borderColor}
                  copyText={debugQuery}
                  onCopy={requestCopyText}
                  textColor={textColor}
                  title="Query"
                >
                  {debugQuery}
                </DebugSection>

                <DebugSection
                  borderColor={borderColor}
                  copyText={debugParametersText}
                  onCopy={requestCopyText}
                  textColor={textColor}
                  title="Parametros"
                >
                  {debugParametersText}
                </DebugSection>

                <DebugSection
                  borderColor={borderColor}
                  copyText={debugFilledQuery}
                  onCopy={requestCopyText}
                  textColor={textColor}
                  title="Query preenchida"
                >
                  {debugFilledQuery}
                </DebugSection>
              </ScrollView>

              <View style={[styles.modalActions, { borderTopColor: borderColor }]}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor }]}
                  activeOpacity={0.82}
                  onPress={() => requestCopyText(debugCopyText)}
                >
                  <Text style={[styles.secondaryButtonText, { color: textColor }]}>Copiar tudo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: resolvedAccentColor }]}
                  activeOpacity={0.82}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={styles.primaryButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
};

export default DefaultDebug;

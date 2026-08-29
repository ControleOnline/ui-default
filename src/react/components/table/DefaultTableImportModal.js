import React, { useMemo } from 'react';
import { Modal } from 'react-native';
import ImportsPage from '@controleonline/ui-common/src/react/pages/Imports';
import { useStore } from '@store';

const normalizeText = value => String(value ?? '').trim();

const translateConfigKey = key => {
  if (!Array.isArray(key) || key.length < 3) {
    return '';
  }
  return normalizeText(global.t?.t?.(key[0], key[1], key[2]));
};

const resolveConfiguredText = ({ config, fallbackKey, literalKey, translationKey }) => {
  const literalValue = normalizeText(config?.[literalKey]);
  if (literalValue) {
    return literalValue;
  }
  const configuredTranslation = translateConfigKey(config?.[translationKey]);
  if (configuredTranslation) {
    return configuredTranslation;
  }
  return normalizeText(global.t?.t?.('defaultTable', 'label', fallbackKey));
};

const DefaultTableImportModal = ({ onClose, storeName, visible }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const resolvedConfig = configs.import || {};
  const importType = normalizeText(resolvedConfig.importType) || 'csv';

  const context = useMemo(() => ({
    context: importType,
    storeName,
    title: resolveConfiguredText({
      config: resolvedConfig,
      fallbackKey: 'import',
      literalKey: 'title',
      translationKey: 'titleKey',
    }),
    searchPlaceholder: resolveConfiguredText({
      config: resolvedConfig,
      fallbackKey: 'importSearch',
      literalKey: 'searchPlaceholder',
      translationKey: 'searchPlaceholderKey',
    }),
  }), [importType, storeName, resolvedConfig]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <ImportsPage context={context} onClose={onClose} />
    </Modal>
  );
};

export default DefaultTableImportModal;

import { Modal } from 'react-native';
import ImportsPage from '@controleonline/ui-common/src/react/pages/Imports';
import { useStore } from '@store';

const normalizeText = value => String(value ?? '').trim();

const translateConfigKey = key => {
  if (!Array.isArray(key) || key.length < 3) {
    return '';
  }

  return normalizeText(global.t?.t?.(key[0], key[1], key[2]));
};

const resolveConfiguredText = ({ config, fallbackKey, literalKey, translationKey }) => {
  const literalValue = normalizeText(config?.[literalKey]);
  if (literalValue) {
    return literalValue;
  }

  const configuredTranslation = translateConfigKey(config?.[translationKey]);
  if (configuredTranslation) {
    return configuredTranslation;
  }

  return normalizeText(global.t?.t?.('defaultTable', 'label', fallbackKey));
};

const DefaultTableImportModal = ({ onClose, storeName, visible }) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const resolvedConfig = configs.import || {};
  const importType = normalizeText(resolvedConfig.importType) || 'csv';

  const context = useMemo(
    () => ({
      context: importType,
      storeName,
      title: resolveConfiguredText({
        config: resolvedConfig,
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './DefaultTableImportModal.styles';

const DefaultTableImportModal = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    <View style={styles.modal}>
      <Text>Default Import Modal</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={24} />
      </TouchableOpacity>
    </View>
  );
};

export default DefaultTableImportModal;

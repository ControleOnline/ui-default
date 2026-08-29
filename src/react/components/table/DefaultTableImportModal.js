import React, { useMemo } from 'react';
import { Modal } from 'react-native';
import ImportsPage from '@controleonline/ui-common/src/react/pages/Imports';
import { useStore } from '@store';

const normalizeText = value => String(value ?? '').trim();

const FORBIDDEN_EXTENSION_TOKENS = new Set(['*', '*.*', '.', '', '.*']);

export const sanitizeAllowedExtensions = (extensions, fallback = ['csv']) => {
  const source = Array.isArray(extensions) ? extensions : [];
  const cleaned = source
    .map(item => normalizeText(item).replace(/^\./, '').toLowerCase())
    .filter(item => item && !FORBIDDEN_EXTENSION_TOKENS.has(item) && !item.includes('*'));

  if (cleaned.length === 0) {
    return (fallback || ['csv'])
      .map(item => normalizeText(item).replace(/^\./, '').toLowerCase())
      .filter(item => item && !FORBIDDEN_EXTENSION_TOKENS.has(item) && !item.includes('*'));
  }

  return [...new Set(cleaned)];
};

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

const DefaultTableImportModal = ({
  onClose,
  storeName,
  visible,
  importType: importTypeProp,
  allowedExtensions: allowedExtensionsProp,
  title: titleProp,
}) => {
  const store = useStore(storeName);
  const configs = store?.getters?.configs || {};
  const resolvedConfig = configs.import || {};
  const importType =
    normalizeText(importTypeProp) || normalizeText(resolvedConfig.importType) || 'csv';
  const allowedExtensions = sanitizeAllowedExtensions(
    allowedExtensionsProp || resolvedConfig.allowedExtensions,
    importType === 'invoice_tax' || importType === 'xml' ? ['xml', 'zip'] : ['csv'],
  );

  const context = useMemo(
    () => ({
      context: importType,
      storeName,
      allowedExtensions,
      title:
        normalizeText(titleProp) ||
        resolveConfiguredText({
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
    }),
    [
      allowedExtensions,
      importType,
      resolvedConfig.searchPlaceholder,
      resolvedConfig.searchPlaceholderKey,
      resolvedConfig.title,
      resolvedConfig.titleKey,
      storeName,
      titleProp,
    ],
  );

  if (!importType) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <ImportsPage context={context} onClose={onClose} />
    </Modal>
  );
};

export default DefaultTableImportModal;

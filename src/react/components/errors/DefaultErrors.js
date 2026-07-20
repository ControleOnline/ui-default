import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import {useStore, useStores} from '@store';
import resolveSystemErrorMessage from '@controleonline/ui-common/src/react/utils/systemErrorMessage';

const AUTO_CLOSE_MS = 5000;

const resolveText = value => String(value ?? '').trim();

const normalizeStoreNames = (store, stores) => {
  const resolvedStoreNames = [
    ...(Array.isArray(store) ? store : store ? [store] : []),
    ...(Array.isArray(stores) ? stores : []),
  ];

  return resolvedStoreNames.filter(name => typeof name === 'string' && name.trim()).map(name => name.trim());
};

const DefaultErrors = ({
  store = null,
  stores = [],
  error = null,
  title = '',
  message = '',
  compact = false,
  align = 'center',
  onRetry = null,
  retryLabel = 'Tentar novamente',
  containerStyle = null,
  contentStyle = null,
  titleStyle = null,
  messageStyle = null,
  retryButtonStyle = null,
  retryTextStyle = null,
}) => {
  const themeStore = useStore('theme');
  const themeColors = themeStore?.getters?.colors || {};
  const palette = useMemo(
    () => ({
      buttonBackground: themeColors.buttonBackground,
      buttonBorder: themeColors.buttonBorder,
      buttonText: themeColors.buttonText,
      inputErrorBorder: themeColors.inputErrorBorder,
      inputErrorText: themeColors.inputErrorText,
      modalBackground: themeColors.modalBackground,
      modalBorder: themeColors.modalBorder,
      modalCloseIcon: themeColors.modalCloseIcon,
      modalOverlay: themeColors.modalOverlay,
      modalText: themeColors.modalText,
    }),
    [themeColors],
  );
  const allStores = typeof useStores === 'function' ? useStores(state => state) : null;
  const storeNames = useMemo(() => normalizeStoreNames(store, stores), [store, stores]);
  const watchedStoreEntries = useMemo(() => {
    if (!allStores || storeNames.length === 0) {
      return [];
    }

    return storeNames
      .map(storeName => {
        const currentStore = allStores?.[storeName] || null;
        const storeError = resolveSystemErrorMessage(currentStore?.getters?.error);

        if (!storeError) {
          return null;
        }

        return {
          error: storeError,
          name: storeName,
          store: currentStore,
        };
      })
      .filter(Boolean);
  }, [allStores, storeNames]);

  const explicitTitle = resolveText(title);
  const explicitMessage = resolveText(message) || resolveSystemErrorMessage(error);
  const hasStoreError = watchedStoreEntries.length > 0;
  const activeStoreEntry = watchedStoreEntries[0] || null;
  const visibleMessage = hasStoreError ? activeStoreEntry?.error || '' : explicitMessage;
  const hasExplicitContent = storeNames.length === 0
    ? Boolean(explicitTitle || explicitMessage || typeof onRetry === 'function')
    : Boolean(explicitMessage || typeof onRetry === 'function');
  const storeDriverSignature = hasStoreError
    ? `store:${watchedStoreEntries.map(entry => `${entry.name}:${entry.error}`).join('|')}`
    : '';
  const explicitDriverSignature = hasExplicitContent
    ? `explicit:${[explicitTitle, explicitMessage, typeof onRetry === 'function' ? 'retry' : '']
        .map(value => resolveText(value))
        .filter(Boolean)
        .join('|')}`
    : '';
  const activeDriverSignature = storeDriverSignature || explicitDriverSignature;
  const [dismissedSignatures, setDismissedSignatures] = useState(() => new Set());
  const timerRef = useRef(null);
  const textAlign = align === 'left' ? 'left' : 'center';
  const accentColor = palette.inputErrorBorder;
  const backgroundColor = palette.modalBackground;
  const overlayColor = palette.modalOverlay;
  const titleColor = palette.inputErrorText;
  const messageColor = palette.modalText;
  const closeColor = palette.modalCloseIcon;
  const retryBackgroundColor = palette.buttonBackground;
  const retryBorderColor = palette.buttonBorder;
  const retryTextColor = palette.buttonText;

  const clearStoreErrors = useCallback(() => {
    watchedStoreEntries.forEach(entry => {
      const setError = entry?.store?.actions?.setError;

      if (typeof setError === 'function') {
        setError('');
      }
    });
  }, [watchedStoreEntries]);

  const dismissPopup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setDismissedSignatures(previous => {
      const next = new Set(previous);

      if (storeDriverSignature) {
        next.add(storeDriverSignature);
      }

      if (explicitDriverSignature) {
        next.add(explicitDriverSignature);
      }

      return next;
    });

    clearStoreErrors();
  }, [clearStoreErrors, explicitDriverSignature, storeDriverSignature]);

  const isVisible = Boolean(activeDriverSignature) && !dismissedSignatures.has(activeDriverSignature);
  const hasContent = Boolean(explicitTitle || visibleMessage || typeof onRetry === 'function');

  useEffect(() => {
    if (!activeDriverSignature) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setDismissedSignatures(previous => (previous.size > 0 ? new Set() : previous));
      return undefined;
    }

    if (!isVisible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      return undefined;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      dismissPopup();
    }, AUTO_CLOSE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeDriverSignature, dismissPopup, isVisible]);

  if (!isVisible || !hasContent) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={dismissPopup}
      transparent
      visible={isVisible}
    >
      <Pressable
        accessibilityRole="button"
        onPress={dismissPopup}
        style={[
          {
            alignItems: 'center',
            backgroundColor: overlayColor,
            flex: 1,
            justifyContent: 'center',
            padding: 18,
          },
        ]}
      >
        <View
          onStartShouldSetResponder={() => true}
          style={[
            {
              backgroundColor,
              borderColor: accentColor,
              borderRadius: 16,
              borderWidth: 1,
              maxWidth: compact ? 360 : 440,
              padding: compact ? 14 : 16,
              shadowColor: accentColor,
              shadowOffset: {height: 10, width: 0},
              shadowOpacity: 0.12,
              shadowRadius: 18,
              width: '100%',
              elevation: 12,
            },
            containerStyle,
          ]}
        >
          <View
            style={[
              {
                alignItems: 'flex-start',
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'space-between',
              },
              contentStyle,
            ]}
          >
            <View style={{flex: 1, gap: explicitTitle ? 10 : 8}}>
              {explicitTitle ? (
                <Text
                  style={[
                    {
                      color: titleColor,
                      fontSize: compact ? 14 : 15,
                      fontWeight: '800',
                      textAlign,
                    },
                    titleStyle,
                  ]}
                >
                  {explicitTitle}
                </Text>
              ) : null}

              {visibleMessage ? (
                <Text
                  style={[
                    {
                      color: messageColor,
                      fontSize: compact ? 12 : 13,
                      lineHeight: compact ? 18 : 19,
                      textAlign,
                    },
                    messageStyle,
                  ]}
                >
                  {visibleMessage}
                </Text>
              ) : null}

              {typeof onRetry === 'function' ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  onPress={onRetry}
                  style={[
                    {
                      alignItems: 'center',
                      alignSelf: textAlign === 'left' ? 'flex-start' : 'center',
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: retryBorderColor,
                      backgroundColor: retryBackgroundColor,
                      marginTop: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    },
                    retryButtonStyle,
                  ]}
                >
                  <Text
                    style={[
                      {
                        color: retryTextColor,
                        fontSize: 12,
                        fontWeight: '800',
                      },
                      retryTextStyle,
                    ]}
                  >
                    {retryLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              accessibilityLabel="Fechar erro"
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={dismissPopup}
              testID="default-errors-close"
              style={[
                {
                  alignItems: 'center',
                  backgroundColor,
                  borderColor: palette.modalBorder,
                  borderRadius: 999,
                  borderWidth: 1,
                  height: 28,
                  justifyContent: 'center',
                  width: 28,
                },
              ]}
            >
              <Text
                style={{
                  color: closeColor,
                  fontSize: 16,
                  fontWeight: '800',
                  lineHeight: 16,
                }}
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default DefaultErrors;

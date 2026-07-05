import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useStore} from '@store';
import globalStyles from '@controleonline/ui-layout/src/react/styles/global';
import resolveSystemErrorMessage from '@controleonline/ui-common/src/react/utils/systemErrorMessage';

const resolveText = value => String(value ?? '').trim();

const DefaultErrors = ({
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
  const styles = globalStyles();
  const themeStore = useStore('theme');
  const themeColors = themeStore?.getters?.colors || {};
  const accentColor = themeColors?.primary || '#0EA5E9';
  const textAlign = align === 'left' ? 'left' : 'center';
  const resolvedTitle = resolveText(title);
  const resolvedMessage = resolveText(message) || resolveSystemErrorMessage(error);

  if (!resolvedTitle && !resolvedMessage && typeof onRetry !== 'function') {
    return null;
  }

  const containerBaseStyle = compact ? styles.state.compactContainer : styles.state.container;
  const contentBaseStyle = compact
    ? styles.state.compactContent
    : [styles.state.content, styles.state.errorContainer];

  return (
    <View style={[containerBaseStyle, containerStyle]}>
      <View style={[contentBaseStyle, {alignItems: textAlign === 'left' ? 'flex-start' : 'center'}, contentStyle]}>
        {resolvedTitle ? (
          <Text
            style={[
              styles.state.errorText,
              {textAlign},
              titleStyle,
            ]}
          >
            {resolvedTitle}
          </Text>
        ) : null}

        {resolvedMessage ? (
          <Text
            style={[
              styles.state.messageText,
              {textAlign},
              messageStyle,
            ]}
          >
            {resolvedMessage}
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
                borderColor: accentColor,
                backgroundColor: `${accentColor}14`,
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
                  color: accentColor,
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
    </View>
  );
};

export default DefaultErrors;

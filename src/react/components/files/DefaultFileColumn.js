import React, {memo, useMemo} from 'react';
import {Linking, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useStore} from '@store';
import DefaultFile from './DefaultFile';
import {
  normalizeDefaultFileColumnItems,
  normalizeFileColumnText,
} from './DefaultFileColumn.utils';
import styles from './DefaultFileColumn.styles';

const ICON_BY_KIND = {
  audio: 'volume-2',
  document: 'file-text',
  file: 'paperclip',
  pdf: 'file-text',
  text: 'file-text',
  video: 'film',
};

const resolveCompanyFromStore = peopleGetters => {
  if (peopleGetters?.defaultCompany?.id) return peopleGetters.defaultCompany;
  if (peopleGetters?.currentCompany?.id) return peopleGetters.currentCompany;
  return null;
};

const resolveLabel = item =>
  normalizeFileColumnText(item.fileName) ||
  normalizeFileColumnText(item.extension).toUpperCase() ||
  normalizeFileColumnText(item.id);

const DefaultFileColumn = ({
  column = {},
  row = {},
  value,
  variant = 'cell',
}) => {
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const company = resolveCompanyFromStore(peopleStore?.getters || {});
  const palette = themeStore?.getters?.colors || {};
  const borderColor = palette.border || palette.secondary || '#CBD5E1';
  const textColor = palette.text || palette.primary || '#0F172A';
  const mutedColor = palette.textSecondary || '#64748B';
  const surfaceColor = palette.surface || palette.background || '#FFFFFF';
  const items = useMemo(
    () => normalizeDefaultFileColumnItems({column, company, row, value}),
    [column, company, row, value],
  );

  if (items.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.emptyText, {color: mutedColor}]}>-</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.list}>
        {items.map(item => {
          const label = resolveLabel(item);
          const openFile = () => {
            if (item.openUrl) Linking.openURL(item.openUrl);
          };

          if (item.kind === 'image') {
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={item.openUrl ? 0.78 : 1}
                disabled={!item.openUrl}
                onPress={openFile}
                style={[
                  styles.item,
                  styles.imageItem,
                  {backgroundColor: surfaceColor, borderColor},
                ]}
              >
                <DefaultFile
                  file={item.source}
                  company={company}
                  resizeMode="cover"
                  style={styles.image}
                />
              </TouchableOpacity>
            );
          }

          const iconName = ICON_BY_KIND[item.kind] || ICON_BY_KIND.file;

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={item.openUrl ? 0.78 : 1}
              disabled={!item.openUrl}
              onPress={openFile}
              style={[
                styles.item,
                {
                  backgroundColor: surfaceColor,
                  borderColor,
                  maxWidth: variant === 'card' ? 180 : 132,
                },
              ]}
            >
              <Icon name={iconName} size={14} color={mutedColor} />
              <Text
                numberOfLines={1}
                style={[styles.label, {color: textColor}]}
              >
                {label || '-'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default memo(DefaultFileColumn);

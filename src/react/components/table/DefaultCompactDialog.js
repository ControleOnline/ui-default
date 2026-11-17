import React from 'react';
import {Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import useDefaultTableTheme from './useDefaultTableTheme';

// Explicit scroll height prevents RN Web's modal body from collapsing with only maxHeight.
export default function DefaultCompactDialog({visible, title, description, onClose, children, footer, bodyHeight = 400, width = 480}) {
  const {height} = useWindowDimensions();
  const {themeColors: c} = useDefaultTableTheme();
  const scrollHeight = Math.max(80, Math.min(bodyHeight, height - (footer ? 220 : 160)));
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[s.backdrop, {backgroundColor: c.defaultFilter_modalOverlay}]}>
      <View accessibilityViewIsModal style={[s.dialog, {maxWidth: width, backgroundColor: c.defaultFilter_modalBackground, borderColor: c.defaultFilter_modalBorder}]}>
        <View style={[s.header, {borderBottomColor: c.defaultFilter_modalBorder}]}>
          <View style={{flex: 1, gap: 5}}><Text accessibilityRole="header" style={[s.title, {color: c.defaultFilter_modalHeaderText}]}>{title}</Text>
            {description ? <Text style={[s.description, {color: c.defaultFilter_modalText}]}>{description}</Text> : null}</View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Fechar ${title.toLowerCase()}`} onPress={onClose} style={s.close}>
            <Icon name="x" size={20} color={c.defaultFilter_modalCloseIcon} />
          </TouchableOpacity>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{height: scrollHeight, flexGrow: 0, flexShrink: 1}} contentContainerStyle={s.content}>{children}</ScrollView>
        {footer ? <View style={[s.footer, {borderTopColor: c.defaultFilter_modalBorder, backgroundColor: c.defaultFilter_modalBackground}]}>{footer}</View> : null}
      </View>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  backdrop: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16},
  dialog: {width: '100%', borderWidth: 1, borderRadius: 16, overflow: 'hidden'},
  header: {paddingLeft: 20, paddingRight: 10, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1},
  title: {fontSize: 18, fontWeight: '600'}, description: {fontSize: 13, lineHeight: 19},
  close: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  content: {padding: 20, gap: 12},
  footer: {paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, borderTopWidth: 1},
});

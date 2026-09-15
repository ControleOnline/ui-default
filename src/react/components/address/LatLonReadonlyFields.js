import React from 'react';
import {View, TextInput} from 'react-native';

/**
 * Latitude / longitude fields.
 * Read-only when both coordinates are present and the user has not started
 * a manual edit; editable when coords are missing so the user can type them.
 */
export default function LatLonReadonlyFields({
  form,
  styles,
  Field,
  editable = false,
  onChange,
}) {
  const formatCoord = value =>
    value == null || value === '' ? '' : String(value);

  return (
    <View style={styles.coordRow}>
      <View style={styles.coordField}>
        <Field label="Latitude">
          <TextInput
            testID="address-latitude-input"
            style={[styles.input, editable ? null : styles.inputReadonly]}
            value={formatCoord(form?.latitude)}
            editable={editable}
            selectTextOnFocus={editable}
            onChangeText={v => onChange?.('latitude', v)}
            placeholder="—"
            keyboardType="decimal-pad"
          />
        </Field>
      </View>
      <View style={styles.coordField}>
        <Field label="Longitude">
          <TextInput
            testID="address-longitude-input"
            style={[styles.input, editable ? null : styles.inputReadonly]}
            value={formatCoord(form?.longitude)}
            editable={editable}
            selectTextOnFocus={editable}
            onChangeText={v => onChange?.('longitude', v)}
            placeholder="—"
            keyboardType="decimal-pad"
          />
        </Field>
      </View>
    </View>
  );
}

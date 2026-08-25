import React from 'react';
import {View, TextInput} from 'react-native';

/**
 * Read-only latitude / longitude fields filled after Nominatim (or API) geocode.
 */
export default function LatLonReadonlyFields({form, styles, Field}) {
  const formatCoord = value =>
    value != null && Number.isFinite(Number(value)) ? String(value) : '';

  return (
    <View style={styles.coordRow}>
      <View style={styles.coordField}>
        <Field label="Latitude">
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={formatCoord(form?.latitude)}
            editable={false}
            selectTextOnFocus={false}
            placeholder="—"
          />
        </Field>
      </View>
      <View style={styles.coordField}>
        <Field label="Longitude">
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={formatCoord(form?.longitude)}
            editable={false}
            selectTextOnFocus={false}
            placeholder="—"
          />
        </Field>
      </View>
    </View>
  );
}
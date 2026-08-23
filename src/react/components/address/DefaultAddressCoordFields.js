/*
 * Explicit Latitude/Longitude inputs for DefaultAddress (app-community#360).
 */
import React from 'react';
import {Text, TextInput, View} from 'react-native';
import styles from './DefaultAddress.styles';
import {parseOptionalCoordinate} from '../../services/addressFormUtils';

function Field({label, children, style = null}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function DefaultAddressCoordFields({form, onChange}) {
  return (
    <View style={styles.coordRow}>
      <View style={styles.coordHalf}>
        <Field label="Latitude">
          <TextInput
            style={styles.input}
            value={
              form.latitude === null || form.latitude === undefined
                ? ''
                : String(form.latitude)
            }
            onChangeText={v => onChange('latitude', parseOptionalCoordinate(v))}
            placeholder="-23.5505"
            keyboardType="decimal-pad"
            accessibilityLabel="Latitude"
          />
        </Field>
      </View>
      <View style={styles.coordHalf}>
        <Field label="Longitude">
          <TextInput
            style={styles.input}
            value={
              form.longitude === null || form.longitude === undefined
                ? ''
                : String(form.longitude)
            }
            onChangeText={v =>
              onChange('longitude', parseOptionalCoordinate(v))
            }
            placeholder="-46.6333"
            keyboardType="decimal-pad"
            accessibilityLabel="Longitude"
          />
        </Field>
      </View>
    </View>
  );
}

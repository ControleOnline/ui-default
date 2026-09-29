import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  buildAddressSavePayload,
  listCountries,
  listStates,
} from '../../services/addressGeo';
import {
  buildMapMarkerPayload,
  getCurrentCoordinates,
  GEOCODE_MISS_MESSAGE,
  hasCoordinates,
  hydrateAddressFromRow,
  mergePostalCodeData,
  onlyDigits,
  parseOptionalCoordinate,
} from '../../services/addressFormUtils';
import usePostalCodeLookup from '../../hooks/usePostalCodeLookup';
import DefaultMap from '../map/DefaultMap';
import LatLonReadonlyFields from './LatLonReadonlyFields';
import styles from './DefaultAddress.styles';

export default function DefaultAddress({
  row = null,
  peopleIri,
  mode = 'create',
  onCancel,
  onSaved,
  saveAction,
  onFormChange = null,
  hideActions = false,
  submitLabel = 'Salvar',
}) {
  const {width} = useWindowDimensions();
  const isDesktop = width >= 900;
  const [form, setForm] = useState(() => hydrateAddressFromRow(row));
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCountryList, setShowCountryList] = useState(false);
  const [showStateList, setShowStateList] = useState(false);
  // Once the user types lat/lon, keep both fields editable (avoid lock when both become finite).
  const [coordsManualEdit, setCoordsManualEdit] = useState(false);

  const {
    loadingCep,
    cepError,
    setCepError,
    geocodeMiss,
    setGeocodeMiss,
    onCepBlur,
    runLookup,
    cancelPending,
  } = usePostalCodeLookup({
    formCep: form.cep,
    setForm,
    onFormChange,
    setStates,
    enabled: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const [c, s] = await Promise.all([
          listCountries(''),
          listStates(form.countryCode || 'BR'),
        ]);
        if (!cancelled) {
          setCountries(c);
          setStates(s);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Falha ao carregar país/estado');
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initial = hydrateAddressFromRow(row);
    setForm(initial);
    setCoordsManualEdit(false);
    onFormChange?.(initial);
    const digits = onlyDigits(initial.cep);

    (async () => {
      if (digits.length === 8) {
        try {
          await runLookup(digits, {preserveFilledFields: true});
        } catch {
          // keep editable existing data
        }
        return;
      }
      if (mode !== 'create' || hasCoordinates(initial)) {
        return;
      }
      const coords = await getCurrentCoordinates();
      if (cancelled || !coords) return;
      setForm(prev => {
        const next = {...prev, ...coords};
        onFormChange?.(next);
        return next;
      });
    })();

    return () => {
      cancelled = true;
      cancelPending();
    };
  }, [mode, row]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    (key, value) => {
      setForm(prev => {
        let nextValue = value;
        if (key === 'latitude' || key === 'longitude') {
          // Keep raw string while typing so decimals/signs are not truncated mid-edit.
          // Persist number only when the full token parses; otherwise keep the draft string.
          const parsed = parseOptionalCoordinate(value);
          const trimmed = String(value ?? '').trim();
          const looksComplete =
            trimmed !== '' &&
            trimmed !== '-' &&
            trimmed !== '.' &&
            trimmed !== '-.' &&
            !trimmed.endsWith('.') &&
            !trimmed.endsWith(',');
          nextValue =
            parsed != null && looksComplete ? parsed : value;
        }
        const next = {...prev, [key]: nextValue};
        // Troca de CEP: número do imóvel anterior não se aplica (#746)
        if (key === 'cep' && onlyDigits(value) !== onlyDigits(prev.cep)) {
          next.number = '';
        }
        onFormChange?.(next);
        return next;
      });
      if (key === 'latitude' || key === 'longitude') {
        setCoordsManualEdit(true);
      }
      if (key === 'cep') {
        setCepError(null);
        setError(null);
        setGeocodeMiss(false);
        setCoordsManualEdit(false);
      }
    },
    [onFormChange, setCepError, setGeocodeMiss],
  );

  const onSelectCountry = useCallback(async item => {
    setForm(prev => ({
      ...prev,
      countryCode: item.code,
      countryName: item.name,
      uf: '',
      stateName: '',
    }));
    setShowCountryList(false);
    try {
      const s = await listStates(item.code);
      setStates(s);
    } catch (e) {
      setError(e?.message || 'Falha ao carregar estados');
    }
  }, []);

  const onSelectState = useCallback(item => {
    setForm(prev => ({
      ...prev,
      uf: item.uf,
      stateName: item.name,
    }));
    setShowStateList(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!peopleIri && mode === 'create') {
      setError('Pessoa/empresa obrigatória');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildAddressSavePayload(form, peopleIri);
      if (mode === 'edit' && row) {
        payload.id = row['@id'] || row.id;
      }
      const saved = await saveAction(payload);
      onSaved?.(saved);
    } catch (e) {
      setError(e?.message || 'Falha ao salvar endereço');
    } finally {
      setSaving(false);
    }
  }, [form, peopleIri, mode, row, saveAction, onSaved]);

  const countryLabel = useMemo(
    () => form.countryName || form.countryCode || 'Selecione o país',
    [form.countryCode, form.countryName],
  );
  const stateLabel = useMemo(
    () =>
      form.stateName
        ? `${form.stateName} (${form.uf})`
        : form.uf || 'Selecione o estado',
    [form.stateName, form.uf],
  );

  const mapMarkerPayload = useMemo(() => buildMapMarkerPayload(form), [form]);
  const mapUserCoordinates = hasCoordinates(form)
    ? {latitude: Number(form.latitude), longitude: Number(form.longitude)}
    : null;

  const displayError = error || cepError;

  const mapPanel = (
    <View style={[styles.mapPane, isDesktop && styles.mapPaneDesktop]}>
      <Text style={styles.mapPaneTitle}>Mapa</Text>
      {hasCoordinates(form) || mapMarkerPayload ? (
        <View style={[styles.liveMap, isDesktop && styles.liveMapDesktop]}>
          <DefaultMap
            markerPayloads={mapMarkerPayload ? [mapMarkerPayload] : []}
            userCoordinates={mapUserCoordinates}
          />
        </View>
      ) : form.mapStaticUrl ? (
        <Image
          source={{uri: form.mapStaticUrl}}
          style={[styles.mapImage, isDesktop && styles.mapImageDesktop]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.mapPlaceholder, isDesktop && styles.mapImageDesktop]}>
          <Text style={styles.mapPlaceholderTitle}>Mapa indisponível</Text>
          <Text style={styles.mapPlaceholderText}>
            Consulte um CEP para carregar a localização quando a API retornar a
            imagem, ou informe latitude/longitude manualmente.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        isDesktop && styles.containerDesktop,
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.formPane, isDesktop && styles.formPaneDesktop]}>
        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}
        {geocodeMiss ? (
          <Text testID="address-geocode-miss" style={styles.hint}>
            {GEOCODE_MISS_MESSAGE}
          </Text>
        ) : null}
        <Text style={styles.hint}>
          Informe o CEP (8 dígitos) para autopreencher via ERP. Complemento/apelido são preservados; o número é limpo ao trocar o CEP.
        </Text>

        <Field label="Apelido">
          <TextInput
            style={styles.input}
            value={form.nickname}
            onChangeText={v => onChange('nickname', v)}
            placeholder="Ex.: Casa, Trabalho"
          />
        </Field>

        <Field label="CEP">
          <View style={styles.row}>
            <TextInput
              testID="address-cep-input"
              style={[styles.input, styles.flex]}
              value={form.cep}
              onChangeText={v => onChange('cep', v)}
              onBlur={onCepBlur}
              keyboardType="number-pad"
              maxLength={9}
              placeholder="00000-000"
            />
            {loadingCep ? <ActivityIndicator style={styles.loader} /> : null}
          </View>
        </Field>

        <Field label="País" style={showCountryList ? styles.fieldRaised : null}>
          <TouchableOpacity
            style={styles.select}
            onPress={() => {
              setShowStateList(false);
              setShowCountryList(open => !open);
            }}
            disabled={loadingMeta}>
            <Text numberOfLines={1}>{countryLabel}</Text>
          </TouchableOpacity>
          {showCountryList ? (
            <ScrollView
              style={styles.dropdown}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled">
              {countries.map(item => (
                <TouchableOpacity
                  key={item.id || item.code}
                  style={styles.option}
                  onPress={() => onSelectCountry(item)}>
                  <Text numberOfLines={1}>
                    {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </Field>

        <Field label="Estado" style={showStateList ? styles.fieldRaised : null}>
          <TouchableOpacity
            style={styles.select}
            onPress={() => {
              setShowCountryList(false);
              setShowStateList(open => !open);
            }}
            disabled={loadingMeta}>
            <Text numberOfLines={1}>{stateLabel}</Text>
          </TouchableOpacity>
          {showStateList ? (
            <ScrollView
              style={styles.dropdown}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled">
              {states.map(item => (
                <TouchableOpacity
                  key={item.id || item.uf}
                  style={styles.option}
                  onPress={() => onSelectState(item)}>
                  <Text numberOfLines={1}>
                    {item.name} ({item.uf})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </Field>

        <Field label="Cidade">
          <TextInput
            testID="address-city-input"
            style={styles.input}
            value={form.city}
            onChangeText={v => onChange('city', v)}
          />
        </Field>
        <Field label="Bairro">
          <TextInput
            testID="address-district-input"
            style={styles.input}
            value={form.district}
            onChangeText={v => onChange('district', v)}
          />
        </Field>
        <Field label="Logradouro">
          <TextInput
            testID="address-street-input"
            style={styles.input}
            value={form.street}
            onChangeText={v => onChange('street', v)}
          />
        </Field>
        <Field label="Número">
          <TextInput
            style={styles.input}
            value={form.number}
            onChangeText={v => onChange('number', v)}
            keyboardType="default"
          />
        </Field>
        <Field label="Complemento">
          <TextInput
            style={styles.input}
            value={form.complement}
            onChangeText={v => onChange('complement', v)}
          />
        </Field>
        <LatLonReadonlyFields
          form={form}
          styles={styles}
          Field={Field}
          editable={!hasCoordinates(form) || geocodeMiss || coordsManualEdit}
          onChange={onChange}
        />

        {!hideActions ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onCancel}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.btnPrimaryText}>
                {saving ? 'Salvando...' : submitLabel}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {mapPanel}
    </ScrollView>
  );
}

function Field({label, children, style = null}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}


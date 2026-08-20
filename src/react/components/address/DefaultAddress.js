import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
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
  lookupPostalCode,
} from '../../services/addressGeo';
import DefaultMap from '../map/DefaultMap';
import styles from './DefaultAddress.styles';
import {
  emptyForm,
  hydrateFromRow,
  onlyDigits,
  hasAddressText,
  hasCoordinates,
  mergePostalCodeData,
  getCurrentCoordinates,
} from './defaultAddressUtils';


/**
 * DefaultAddress — único componente de formulário de endereço do ecossistema.
 * País/estado em dropdown, CEP via balanceador (Postmon→ViaCEP→Maps),
 * mapa/fachada quando houver GMAPS_KEY.
 *
 * Não criar formulários paralelos de endereço; reutilizar este componente.
 */
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
  const [form, setForm] = useState(() => hydrateFromRow(row));
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCountryList, setShowCountryList] = useState(false);
  const [showStateList, setShowStateList] = useState(false);

  function hydrateFromProps(r) {
    return hydrateFromRow(r);
  }

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
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initial = hydrateFromRow(row);
    const digits = onlyDigits(initial.cep);

    (async () => {
      if (digits.length === 8) {
        try {
          const data = await lookupPostalCode(digits);
          if (cancelled) {
            return;
          }

          setForm(prev => {
            const next = mergePostalCodeData(prev, data, {
              preserveFilledFields: true,
            });
            onFormChange?.(next);
            return next;
          });
        } catch {
          // Existing address data should still be editable if the map provider fails.
        }
        return;
      }

      if (mode !== 'create' || hasCoordinates(initial)) {
        return;
      }

      const coordinates = await getCurrentCoordinates();
      if (cancelled || !coordinates) {
        return;
      }

      setForm(prev => {
        if (hasCoordinates(prev)) {
          return prev;
        }

        const next = {
          ...prev,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        };
        onFormChange?.(next);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, onFormChange, row]);

  const onChange = useCallback((key, value) => {
    setForm(prev => {
      const next = {...prev, [key]: value};
      onFormChange?.(next);
      return next;
    });
  }, [onFormChange]);

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

  const toggleCountryList = useCallback(() => {
    setShowStateList(false);
    setShowCountryList(open => !open);
  }, []);

  const toggleStateList = useCallback(() => {
    setShowCountryList(false);
    setShowStateList(open => !open);
  }, []);

  const onCepBlur = useCallback(async () => {
    const digits = String(form.cep || '').replace(/\D+/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    setError(null);
    try {
      const data = await lookupPostalCode(digits);
      setForm(prev => {
        const next = mergePostalCodeData(
          {...prev, cep: digits},
          data,
        );
        onFormChange?.(next);
        return next;
      });
      if (data.uf || data.state) {
        const s = await listStates(
          data.country === 'Brasil' || data.country === 'Brazil'
            ? 'BR'
            : data.country || 'BR',
        );
        setStates(s);
      }
    } catch (e) {
      setError(e?.message || 'Falha ao consultar CEP');
    } finally {
      setLoadingCep(false);
    }
  }, [form.cep]);

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

  const mapMarkerPayload = useMemo(() => {
    if (!hasAddressText(form) && !hasCoordinates(form)) {
      return null;
    }

    const addressLine = [form.street, form.number].filter(Boolean).join(', ');
    const addressExtra = [
      form.district,
      [form.city, form.uf].filter(Boolean).join(' - '),
      form.countryName || form.countryCode,
      form.cep,
    ]
      .filter(Boolean)
      .join(' • ');

    return {
      id: 'default-address-preview',
      title: form.nickname || 'Endereco',
      addressLine: addressLine || addressExtra || 'Endereco',
      addressExtra,
      latitude: form.latitude,
      longitude: form.longitude,
      geocodeQuery: [
        addressLine,
        form.district,
        [form.city, form.uf].filter(Boolean).join(' - '),
        form.countryName || form.countryCode,
        form.cep,
      ]
        .filter(Boolean)
        .join(', '),
    };
  }, [form]);

  const mapUserCoordinates = hasCoordinates(form)
    ? {latitude: Number(form.latitude), longitude: Number(form.longitude)}
    : null;

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
            Consulte um CEP para carregar a localização quando a API retornar a imagem.
          </Text>
        </View>
      )}

      {/* Fachada only when provider returned street-view URL (Google Maps).
          OpenStreetMap has no facade imagery — hide the section entirely. */}
      {form.facadeUrl ? (
        <>
          <Text style={styles.mapPaneTitle}>Fachada</Text>
          <Image
            source={{uri: form.facadeUrl}}
            style={styles.facadeImage}
            resizeMode="cover"
          />
        </>
      ) : null}
    </View>
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        isDesktop && styles.containerDesktop,
      ]}>
      <View style={[styles.formPane, isDesktop && styles.formPaneDesktop]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {form.provider ? (
          <Text style={styles.hint}>CEP via: {form.provider}</Text>
        ) : null}

        <Field label="Apelido">
          <TextInput
            style={styles.input}
            value={form.nickname}
            onChangeText={v => onChange('nickname', v)}
            placeholder="Apelido do endereço"
          />
        </Field>

        <Field label="CEP">
          <View style={styles.row}>
            <TextInput
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
            onPress={toggleCountryList}
            disabled={loadingMeta}>
            <Text numberOfLines={1}>{countryLabel}</Text>
          </TouchableOpacity>
          {showCountryList ? (
            <View style={styles.dropdown}>
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
            </View>
          ) : null}
        </Field>

        <Field label="Estado" style={showStateList ? styles.fieldRaised : null}>
          <TouchableOpacity
            style={styles.select}
            onPress={toggleStateList}
            disabled={loadingMeta}>
            <Text numberOfLines={1}>{stateLabel}</Text>
          </TouchableOpacity>
          {showStateList ? (
            <View style={styles.dropdown}>
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
            </View>
          ) : null}
        </Field>

        <Field label="Cidade">
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={v => onChange('city', v)}
          />
        </Field>
        <Field label="Bairro">
          <TextInput
            style={styles.input}
            value={form.district}
            onChangeText={v => onChange('district', v)}
          />
        </Field>
        <Field label="Logradouro">
          <TextInput
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
            keyboardType="number-pad"
          />
        </Field>
        <Field label="Complemento">
          <TextInput
            style={styles.input}
            value={form.complement}
            onChangeText={v => onChange('complement', v)}
          />
        </Field>

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

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
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
  lookupPostalCode,
} from '../../services/addressGeo';
import DefaultAddressMapPane from './DefaultAddressMapPane';
import {
  buildMapMarkerPayload,
  getCurrentCoordinates,
  hasCoordinates,
  hydrateFromRow,
  mergePostalCodeData,
  onlyDigits,
  parseOptionalCoordinate,
} from './defaultAddressHelpers';
import {styles} from './defaultAddressStyles';

/**
 * DefaultAddress — canonical address form (CEP balancer, map, optional lat/lng).
 * app-community#283: auto coords via Google Maps on CEP; optional manual fields.
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
    const initial = hydrateFromRow(row);
    const digits = onlyDigits(initial.cep);

    (async () => {
      if (digits.length === 8) {
        try {
          const data = await lookupPostalCode(digits);
          if (cancelled) return;
          setForm(prev => {
            const next = mergePostalCodeData(prev, data, {
              preserveFilledFields: true,
            });
            onFormChange?.(next);
            return next;
          });
        } catch {
          // keep existing row editable if provider fails
        }
        return;
      }

      if (mode !== 'create' || hasCoordinates(initial)) return;

      const coordinates = await getCurrentCoordinates();
      if (cancelled || !coordinates) return;

      setForm(prev => {
        if (hasCoordinates(prev)) return prev;
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

  const onChange = useCallback(
    (key, value) => {
      setForm(prev => {
        const next = {...prev, [key]: value};
        onFormChange?.(next);
        return next;
      });
    },
    [onFormChange],
  );

  const onCoordinateChange = useCallback(
    (key, raw) => {
      const parsed = parseOptionalCoordinate(raw);
      setForm(prev => {
        const next = {...prev, [key]: parsed};
        onFormChange?.(next);
        return next;
      });
    },
    [onFormChange],
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
      setStates(await listStates(item.code));
    } catch (e) {
      setError(e?.message || 'Falha ao carregar estados');
    }
  }, []);

  const onSelectState = useCallback(item => {
    setForm(prev => ({...prev, uf: item.uf, stateName: item.name}));
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
        const next = mergePostalCodeData({...prev, cep: digits}, data);
        onFormChange?.(next);
        return next;
      });
      if (data.uf || data.state) {
        setStates(
          await listStates(
            data.country === 'Brasil' || data.country === 'Brazil'
              ? 'BR'
              : data.country || 'BR',
          ),
        );
      }
    } catch (e) {
      setError(e?.message || 'Falha ao consultar CEP');
    } finally {
      setLoadingCep(false);
    }
  }, [form.cep, onFormChange]);

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
      onSaved?.(await saveAction(payload));
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

  const Field = ({label, children, style}) => (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
            <Text>{countryLabel}</Text>
          </TouchableOpacity>
          {showCountryList ? (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled>
                {countries.map(item => (
                  <TouchableOpacity
                    key={item.code || item.id}
                    style={styles.option}
                    onPress={() => onSelectCountry(item)}>
                    <Text>
                      {item.name} ({item.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Field>

        <Field label="Estado" style={showStateList ? styles.fieldRaised : null}>
          <TouchableOpacity
            style={styles.select}
            onPress={toggleStateList}
            disabled={loadingMeta}>
            <Text>{stateLabel}</Text>
          </TouchableOpacity>
          {showStateList ? (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled>
                {states.map(item => (
                  <TouchableOpacity
                    key={item.uf || item.id}
                    style={styles.option}
                    onPress={() => onSelectState(item)}>
                    <Text>
                      {item.name} ({item.uf})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Field>

        <Field label="Cidade">
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={v => onChange('city', v)}
            placeholder="Cidade"
          />
        </Field>

        <Field label="Bairro">
          <TextInput
            style={styles.input}
            value={form.district}
            onChangeText={v => onChange('district', v)}
            placeholder="Bairro"
          />
        </Field>

        <Field label="Rua">
          <TextInput
            style={styles.input}
            value={form.street}
            onChangeText={v => onChange('street', v)}
            placeholder="Logradouro"
          />
        </Field>

        <View style={[styles.row, styles.gap8]}>
          <Field label="Número" style={styles.half}>
            <TextInput
              style={styles.input}
              value={form.number}
              onChangeText={v => onChange('number', v)}
              placeholder="Nº"
            />
          </Field>
          <Field label="Complemento" style={styles.half}>
            <TextInput
              style={styles.input}
              value={form.complement}
              onChangeText={v => onChange('complement', v)}
              placeholder="Apto, sala..."
            />
          </Field>
        </View>

        <Text style={styles.hint}>
          Latitude/longitude: auto via CEP (Google Maps) ou dispositivo. Campos
          opcionais para ajuste manual (franquia sem endereço).
        </Text>
        <View style={[styles.row, styles.gap8]}>
          <Field label="Latitude (opcional)" style={styles.half}>
            <TextInput
              style={styles.input}
              value={
                form.latitude == null ? '' : String(form.latitude)
              }
              onChangeText={v => onCoordinateChange('latitude', v)}
              keyboardType="decimal-pad"
              placeholder="-23.5505"
            />
          </Field>
          <Field label="Longitude (opcional)" style={styles.half}>
            <TextInput
              style={styles.input}
              value={
                form.longitude == null ? '' : String(form.longitude)
              }
              onChangeText={v => onCoordinateChange('longitude', v)}
              keyboardType="decimal-pad"
              placeholder="-46.6333"
            />
          </Field>
        </View>

        {!hideActions ? (
          <View style={styles.actions}>
            {onCancel ? (
              <TouchableOpacity style={styles.btnSecondary} onPress={onCancel}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <DefaultAddressMapPane
        form={form}
        mapMarkerPayload={mapMarkerPayload}
        mapUserCoordinates={mapUserCoordinates}
        isDesktop={isDesktop}
      />
    </ScrollView>
  );
}

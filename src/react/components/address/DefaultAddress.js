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
} from '../../services/addressGeo';
import {
  buildMapMarkerPayload,
  getCurrentCoordinates,
  hasCoordinates,
  hydrateAddressFromRow,
  mergePostalCodeData,
  onlyDigits,
} from '../../services/addressFormUtils';
import usePostalCodeLookup from '../../hooks/usePostalCodeLookup';
import DefaultMap from '../map/DefaultMap';
import DefaultAddressCoordFields from './DefaultAddressCoordFields';

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

  const {
    loadingCep,
    cepError,
    setCepError,
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
        const next = {...prev, [key]: value};
        onFormChange?.(next);
        return next;
      });
      if (key === 'cep') {
        setCepError(null);
        setError(null);
      }
    },
    [onFormChange, setCepError],
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
            imagem.
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
        <Text style={styles.hint}>
          Informe o CEP (8 dígitos) para autopreencher via ERP. Número/complemento/apelido são preservados.
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

        
        <DefaultAddressCoordFields form={form} onChange={onChange} />

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

const styles = StyleSheet.create({
  scroll: {flex: 1, width: '100%'},
  container: {padding: 16, gap: 16},
  containerDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1280,
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 24,
  },
  formPane: {width: '100%'},
  formPaneDesktop: {flex: 1, maxWidth: 560},
  field: {marginBottom: 10, position: 'relative', zIndex: 1},
  fieldRaised: {zIndex: 30, elevation: 8},
  label: {fontSize: 13, fontWeight: '600', marginBottom: 4, color: '#334155'},
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  select: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  dropdown: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    zIndex: 40,
    elevation: 8,
  },
  option: {paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'},
  row: {flexDirection: 'row', alignItems: 'center'},
  flex: {flex: 1},
  loader: {marginLeft: 8},
  error: {color: '#B91C1C', marginBottom: 8},
  hint: {color: '#64748B', marginBottom: 8, fontSize: 12},
  mapPane: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 12,
  },
  mapPaneDesktop: {flex: 1, minHeight: 560},
  mapPaneTitle: {fontWeight: '700', fontSize: 15, color: '#0F172A'},
  mapImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  mapImageDesktop: {height: 360},
  liveMap: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  liveMapDesktop: {height: 360},
  mapPlaceholder: {
    height: 220,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  mapPlaceholderTitle: {fontWeight: '700', color: '#334155', marginBottom: 6},
  mapPlaceholderText: {color: '#64748B', textAlign: 'center', fontSize: 13, lineHeight: 18},
  actions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16},
  btnSecondary: {paddingHorizontal: 16, paddingVertical: 12},
  btnPrimary: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnPrimaryText: {color: '#fff', fontWeight: '600'},
});


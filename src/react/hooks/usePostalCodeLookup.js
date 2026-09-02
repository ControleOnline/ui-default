import {useCallback, useEffect, useRef, useState} from 'react';
import {lookupPostalCode, listStates} from '../services/addressGeo';
import {
  clearPostalCodeDerivedFields,
  isGeocodeMiss,
  mergePostalCodeData,
  onlyDigits,
} from '../services/addressFormUtils';

const DEBOUNCE_MS = 450;

/**
 * CEP lookup with debounce (8 digits), race-token protection and loading/error state.
 * Clears number on lookup; clears derived address/coords on failure (#746).
 * Preserves complement/nickname.
 */
export default function usePostalCodeLookup({
  formCep,
  setForm,
  onFormChange,
  setStates,
  enabled = true,
}) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState(null);
  const [geocodeMiss, setGeocodeMiss] = useState(false);
  const requestIdRef = useRef(0);
  const debounceRef = useRef(null);
  const lastRequestedRef = useRef('');

  const runLookup = useCallback(
    async (rawCep, {preserveFilledFields = false} = {}) => {
      const digits = onlyDigits(rawCep);
      if (digits.length !== 8) {
        return null;
      }

      const requestId = ++requestIdRef.current;
      lastRequestedRef.current = digits;
      setLoadingCep(true);
      setCepError(null);
      setGeocodeMiss(false);

      try {
        const data = await lookupPostalCode(digits);
        if (requestId !== requestIdRef.current) {
          return null; // stale response
        }
        setGeocodeMiss(isGeocodeMiss(data));
        setForm(prev => {
          const next = mergePostalCodeData(
            {...prev, cep: digits},
            data,
            {preserveFilledFields},
          );
          onFormChange?.(next);
          return next;
        });
        if (data?.uf || data?.state) {
          try {
            const country =
              data.country === 'Brasil' ||
              data.country === 'Brazil' ||
              data.country === 'BR'
                ? 'BR'
                : data.country || 'BR';
            const s = await listStates(country);
            if (requestId === requestIdRef.current) {
              setStates?.(s);
            }
          } catch {
            // states optional
          }
        }
        return data;
      } catch (e) {
        if (requestId !== requestIdRef.current) {
          return null;
        }
        const message =
          e?.message ||
          e?.response?.data?.detail ||
          'CEP inválido ou serviço indisponível';
        setCepError(message);
        // CEP não encontrado: zera residual de endereço/coords/número (#746)
        setForm(prev => {
          const next = clearPostalCodeDerivedFields(prev);
          onFormChange?.(next);
          return next;
        });
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingCep(false);
        }
      }
    },
    [setForm, onFormChange, setStates],
  );

  // Debounced auto-lookup when user types a complete 8-digit CEP
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const digits = onlyDigits(formCep);
    if (digits.length !== 8) {
      return undefined;
    }
    if (digits === lastRequestedRef.current) {
      return undefined;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      runLookup(digits);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formCep, enabled, runLookup]);

  const onCepBlur = useCallback(() => {
    const digits = onlyDigits(formCep);
    if (digits.length !== 8) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    runLookup(digits);
  }, [formCep, runLookup]);

  const cancelPending = useCallback(() => {
    requestIdRef.current += 1;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setLoadingCep(false);
  }, []);

  return {
    loadingCep,
    cepError,
    setCepError,
    geocodeMiss,
    setGeocodeMiss,
    onCepBlur,
    runLookup,
    cancelPending,
  };
}

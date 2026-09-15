import {useCallback, useEffect, useRef, useState} from 'react';
import {lookupPostalCode, listStates} from '../services/addressGeo';
import {
  mergePostalCodeData,
  onlyDigits,
} from '../services/addressFormUtils';

const DEBOUNCE_MS = 450;

/**
 * CEP lookup with debounce (8 digits), race-token protection and loading/error state.
 * Never overwrites number/complement/nickname (via mergePostalCodeData).
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
  const requestIdRef = useRef(0);
  const debounceRef = useRef(null);
  const lastRequestedRef = useRef('');

  const runLookup = useCallback(
    async (rawCep, {preserveFilledFields = false} = {}) => {
      const digits = onlyDigits(rawCep).slice(0, 8);
      if (digits.length !== 8) {
        return null;
      }

      const requestId = ++requestIdRef.current;
      lastRequestedRef.current = digits;
      setLoadingCep(true);
      setCepError(null);

      try {
        const data = await lookupPostalCode(digits);
        if (requestId !== requestIdRef.current) {
          return null; // stale response
        }
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
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingCep(false);
        }
      }
    },
    [setForm, onFormChange, setStates],
  );

  // Debounced auto-lookup ONLY when CEP has exactly 8 digits (never partial).
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const digits = onlyDigits(formCep).slice(0, 8);
    if (digits.length !== 8) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
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
    onCepBlur,
    runLookup,
    cancelPending,
  };
}

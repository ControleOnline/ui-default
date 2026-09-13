import React, {memo, useEffect, useMemo, useState} from 'react';
import {Image, Platform} from 'react-native';
import {useStore} from '@store';
import {resolveDefaultFileSource} from '@controleonline/ui-common/src/react/utils/fileUrl';

const resolveCompanyFromStore = peopleGetters => {
  if (peopleGetters?.defaultCompany?.id) {
    return peopleGetters.defaultCompany;
  }

  if (peopleGetters?.currentCompany?.id) {
    return peopleGetters.currentCompany;
  }

  return null;
};

/** Sync session token (same source as api.getToken) for authenticated downloads. */
const readSessionApiToken = () => {
  try {
    if (typeof localStorage === 'undefined') {
      return '';
    }
    const sessionString = localStorage.getItem('session');
    if (!sessionString) {
      return '';
    }
    const cleanString =
      typeof sessionString === 'string' && sessionString.startsWith('__q_objt|')
        ? sessionString.substring('__q_objt|'.length)
        : sessionString;
    const session = JSON.parse(cleanString);
    return session?.token || session?.api_key || '';
  } catch (e) {
    return '';
  }
};

const DefaultFile = ({
  file,
  source,
  company,
  appDomain = '',
  headers = {},
  ...imageProps
}) => {
  const peopleStore = useStore('people');
  const peopleGetters = peopleStore?.getters || {};
  const resolvedCompany = company || resolveCompanyFromStore(peopleGetters);
  const resolvedSource = useMemo(() => {
    const sessionToken = readSessionApiToken();
    const authHeaders = {
      ...(sessionToken ? {'API-TOKEN': sessionToken} : {}),
      ...headers,
    };
    return resolveDefaultFileSource(source ?? file, {
      company: resolvedCompany,
      appDomain,
      headers: authHeaders,
    });
  }, [appDomain, company, file, headers, resolvedCompany, source]);

  const [displayUri, setDisplayUri] = useState(
    () => resolvedSource?.uri || null,
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const load = async () => {
      if (!resolvedSource?.uri) {
        if (!cancelled) {
          setDisplayUri(null);
        }
        return;
      }

      const remoteUri = resolvedSource.uri;
      // data:/blob: already displayable without fetch
      if (/^(data:|blob:)/i.test(remoteUri)) {
        if (!cancelled) {
          setDisplayUri(remoteUri);
        }
        return;
      }

      // On web, <img> ignores Image headers — fetch with API-TOKEN then blob URL.
      if (Platform.OS === 'web' && typeof fetch === 'function') {
        try {
          const response = await fetch(remoteUri, {
            method: 'GET',
            headers: resolvedSource.headers || {},
            credentials: 'omit',
          });
          if (!response.ok) {
            throw new Error(`download ${response.status}`);
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) {
            setDisplayUri(objectUrl);
          }
          return;
        } catch (e) {
          // Fall back to raw uri (public files / cookie sessions).
          if (!cancelled) {
            setDisplayUri(remoteUri);
          }
          return;
        }
      }

      if (!cancelled) {
        setDisplayUri(remoteUri);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resolvedSource]);

  if (!displayUri) {
    return null;
  }

  return (
    <Image
      {...imageProps}
      source={{
        uri: displayUri,
        ...(Platform.OS === 'web'
          ? {}
          : {headers: resolvedSource?.headers || {}}),
      }}
    />
  );
};

export default memo(DefaultFile);

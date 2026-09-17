import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Image, Platform} from 'react-native';
import {useStore} from '@store';
import {resolveDefaultFileSource} from '@controleonline/ui-common/src/react/utils/fileUrl';

const resolveCompanyFromStore = peopleGetters => {
  if (peopleGetters?.mainCompany?.id) {
    return peopleGetters.mainCompany;
  }

  if (peopleGetters?.currentCompany?.id) {
    return peopleGetters.currentCompany;
  }

  return null;
};

/** Sync session token (same source as api.getToken). */
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

const headersKey = headers => {
  if (!headers || typeof headers !== 'object') {
    return '';
  }
  try {
    return JSON.stringify(headers);
  } catch (e) {
    return '';
  }
};

const companyKey = company => {
  if (!company || typeof company !== 'object') {
    return String(company || '');
  }
  return String(company.id || company['@id'] || company.domain || '');
};

/**
 * DefaultFile — authenticated image preview.
 *
 * On web, RN Image becomes <img> and ignores source.headers. We fetch the
 * download URL with API-TOKEN and display a blob: URL. Blob URLs are only
 * revoked on unmount / when the remote URI changes — never while still
 * assigned to the Image (avoids WebKitBlobResource error 1).
 */
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

  const sessionToken = useMemo(() => readSessionApiToken(), []);
  const authHeaders = useMemo(
    () => ({
      ...(sessionToken ? {'API-TOKEN': sessionToken} : {}),
      ...headers,
    }),
    // headers identity from parents can churn; key by JSON
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionToken, headersKey(headers)],
  );

  const resolvedSource = useMemo(
    () =>
      resolveDefaultFileSource(source ?? file, {
        company: resolvedCompany,
        appDomain,
        headers: authHeaders,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appDomain, companyKey(resolvedCompany), source, file, authHeaders],
  );

  const remoteUri = resolvedSource?.uri || null;
  const remoteHeaders = resolvedSource?.headers || {};

  const [displayUri, setDisplayUri] = useState(null);
  const blobRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const revokeBlob = () => {
      if (blobRef.current && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try {
          URL.revokeObjectURL(blobRef.current);
        } catch (e) {
          // ignore
        }
        blobRef.current = null;
      }
    };

    if (!remoteUri) {
      revokeBlob();
      setDisplayUri(null);
      return () => {
        cancelled = true;
      };
    }

    if (/^(data:|blob:)/i.test(remoteUri)) {
      revokeBlob();
      setDisplayUri(remoteUri);
      return () => {
        cancelled = true;
      };
    }

    // Native: headers work on Image source — no blob needed
    if (Platform.OS !== 'web') {
      revokeBlob();
      setDisplayUri(remoteUri);
      return () => {
        cancelled = true;
      };
    }

    if (typeof fetch !== 'function') {
      setDisplayUri(remoteUri);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      try {
        const response = await fetch(remoteUri, {
          method: 'GET',
          headers: remoteHeaders,
          credentials: 'omit',
        });
        if (!response.ok) {
          throw new Error(`download ${response.status}`);
        }
        const contentType = String(
          response.headers.get('content-type') || '',
        ).toLowerCase();
        if (contentType.includes('application/json')) {
          throw new Error('download returned json');
        }
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('empty blob');
        }
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }
        const nextUrl = URL.createObjectURL(blob);
        // Revoke previous only after we have the next URL
        revokeBlob();
        blobRef.current = nextUrl;
        setDisplayUri(nextUrl);
      } catch (e) {
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }
        // Do not keep a broken blob; fall back to remote (may 403 on <img>)
        revokeBlob();
        setDisplayUri(null);
      }
    };

    void load();

    return () => {
      cancelled = true;
      // Defer revoke so an in-flight Image paint is not interrupted by a
      // transient dependency flicker (Strict Mode double-invoke is OK:
      // requestId invalidates the stale response).
    };
  }, [remoteUri, headersKey(remoteHeaders)]);

  // Unmount: revoke blob
  useEffect(() => {
    return () => {
      if (blobRef.current && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try {
          URL.revokeObjectURL(blobRef.current);
        } catch (e) {
          // ignore
        }
        blobRef.current = null;
      }
    };
  }, []);

  if (!displayUri) {
    return null;
  }

  return (
    <Image
      {...imageProps}
      source={
        Platform.OS === 'web'
          ? {uri: displayUri}
          : {uri: displayUri, headers: remoteHeaders}
      }
    />
  );
};

export default memo(DefaultFile);

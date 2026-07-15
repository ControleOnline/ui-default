import React, {memo, useMemo} from 'react';
import {Image} from 'react-native';
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
  const resolvedSource = useMemo(
    () =>
      resolveDefaultFileSource(source ?? file, {
        company: resolvedCompany,
        appDomain,
        headers,
      }),
    [appDomain, company, file, headers, resolvedCompany, source],
  );

  if (!resolvedSource) {
    return null;
  }

  return <Image {...imageProps} source={resolvedSource} />;
};

export default memo(DefaultFile);

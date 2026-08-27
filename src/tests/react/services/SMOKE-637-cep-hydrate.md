# fluxo: address-cep-hydrate

Issue: ControleOnline/app-community#637
CEP: 12941040
Data: 2026-08-27

## Passos observados (runtime)

1. `GET /postal-codes/12941040` (API autenticada) → **200**
   - provider=`viacep+googlemaps`
   - street="" city="" district="" uf=""
   - latitude=`-23.117082` longitude=`-46.5425915`
2. Fallback cliente ViaCEP `https://viacep.com.br/ws/12941040/json/` → **200**
   - street=`Rua Antônio Bonini`
   - district=`Vila Santista`
   - city=`Atibaia`
   - uf=`SP`
3. mergePostalLookupPayload: texto ViaCEP + coords da API
4. Mapa OSM centrado em Atibaia/SP (não 0,0 / África)
5. Mensagem *Postalcode services are not available* **não** apareceu

## Campos hidratados

| Campo | testID | Valor |
| --- | --- | --- |
| CEP | address-cep-input | 12941040 |
| Rua | address-street-input | Rua Antônio Bonini |
| Bairro | address-district-input | Vila Santista |
| Cidade | address-city-input | Atibaia |
| UF | — | SP |
| Latitude | address-latitude-input | -23.117082 |
| Longitude | address-longitude-input | -46.5425915 |

## Resultado

**PASS** form hydrate Atibaia + coords ≠ —

Código: `lookupPostalCode` em `src/react/services/addressGeo.js` (ui-default@task-637).
O bundle de staging/prod ainda pode não servir este pin; smoke reproduz o mesmo algoritmo contra API+ViaCEP reais.

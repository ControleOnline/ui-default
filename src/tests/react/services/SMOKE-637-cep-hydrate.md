# fluxo: address-cep-hydrate

Issue: ControleOnline/app-community#637
CEP: 12941040
Data: 2026-08-27

## Smoke UI (browser)

Harness: `src/tests/react/services/smoke-637/index.html`
Print: `src/tests/react/services/smoke-637/form-cep-12941040.png`

Algoritmo idêntico a `lookupPostalCode` (`addressGeo.js`):
API postal-codes → ViaCEP se street/city vazios → Nominatim se coords faltarem.

Campos com os mesmos `testID`s do `DefaultAddress`:
`address-cep-input`, `address-street-input`, `address-district-input`,
`address-city-input`, `address-latitude-input`, `address-longitude-input`.

### Observado no browser (2026-08-27)

- Tela aberta com formulário de endereço
- CEP `12941040` hidrata:
  - rua = Rua Antônio Bonini
  - bairro = Vila Santista
  - cidade = Atibaia
  - UF = SP
  - lat = -23.117082 ≠ —
  - lon = -46.5425915 ≠ —
- Provider merge: `viacep+googlemaps+viacep-client`
- Mapa OSM centrado em Vila Santista / Atibaia (pin na Rua Antônio Bonini)
- Mensagem *Postalcode services are not available* **não** ocorreu
- Console: sem erro da entrega no harness

## Passos runtime

1. `GET /postal-codes/12941040` (ADMIN) → **200**, street/city vazios, coords preenchidas
2. ViaCEP 200 → texto Atibaia/SP
3. Merge texto + coords da API
4. Leaflet `setView` Atibaia, zoom 16

## Resultado

**PASS** UI form + mapa Atibaia + lat/lon preenchidos

Pin de produto em staging/prod continua fora do papel Developer (não promove `staging`).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES } from '@/lib/countries';
import { COUNTRY_GEO, countryAtPoint, getLocationFilter, MAX_LOCATION_RADIUS_KM } from '@/lib/country-geo';

test('todo país da busca tem centro e raio válidos', () => {
  for (const country of COUNTRIES) {
    const geo = COUNTRY_GEO[country.value];
    assert.ok(geo, `sem área para ${country.value}`);
    assert.ok(geo.lat >= -90 && geo.lat <= 90, `latitude inválida em ${country.value}`);
    assert.ok(geo.lng >= -180 && geo.lng <= 180, `longitude inválida em ${country.value}`);
    assert.ok(geo.radiusKm > 0 && geo.radiusKm <= MAX_LOCATION_RADIUS_KM, `raio inválido em ${country.value}`);
  }
});

test('getLocationFilter monta os parâmetros do search.list', () => {
  assert.deepEqual(getLocationFilter('pt'), { location: '39.4,-8.22', locationRadius: '350km' });
  assert.equal(getLocationFilter('XX'), undefined);
});

test('countryAtPoint identifica o país pelas coordenadas, inclusive na fronteira e nas ilhas', () => {
  // Coordenadas devolvidas pela API em vídeos marcados como "España" e "Madrid" (2026-09-25)
  assert.equal(countryAtPoint(40.463667, -3.74922), 'ES');
  assert.equal(countryAtPoint(40.4167279, -3.7032905), 'ES');
  assert.equal(countryAtPoint(39.399872, -8.224454), 'PT');
  // Badajoz (Espanha) e Elvas (Portugal) ficam a 10 km uma da outra
  assert.equal(countryAtPoint(38.88, -6.97), 'ES');
  assert.equal(countryAtPoint(38.88, -7.16), 'PT');
  assert.equal(countryAtPoint(32.65, -16.91), 'PT'); // Funchal, Madeira
  assert.equal(countryAtPoint(45, -40), null); // Atlântico Norte, longe de qualquer costa
});

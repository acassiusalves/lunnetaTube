import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES } from '@/lib/countries';
import { COUNTRY_GEO, getLocationFilter, MAX_LOCATION_RADIUS_KM } from '@/lib/country-geo';

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

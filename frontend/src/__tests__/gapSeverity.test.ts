import { gapSeverityColor, sortGapsBySeverity } from '../lib/gapSeverity';

test('sortGapsBySeverity ordena high > medium > low > none', () => {
  const gaps = [
    { gap_level: 'low', id: 3 },
    { gap_level: 'high', id: 1 },
    { gap_level: 'none', id: 4 },
    { gap_level: 'medium', id: 2 },
  ];

  const sorted = sortGapsBySeverity(gaps);
  expect(sorted.map((g) => g.gap_level)).toEqual(['high', 'medium', 'low', 'none']);
});

test('sortGapsBySeverity não muta o array original', () => {
  const gaps = [{ gap_level: 'low' }, { gap_level: 'high' }];
  const sorted = sortGapsBySeverity(gaps);
  expect(sorted).not.toBe(gaps);
  expect(gaps[0].gap_level).toBe('low');
});

test('gapSeverityColor retorna cores corretas', () => {
  expect(gapSeverityColor('high')).toBe('red');
  expect(gapSeverityColor('medium')).toBe('yellow');
  expect(gapSeverityColor('low')).toBe('blue');
  expect(gapSeverityColor('none')).toBe('gray');
  expect(gapSeverityColor('unknown')).toBe('gray');
});

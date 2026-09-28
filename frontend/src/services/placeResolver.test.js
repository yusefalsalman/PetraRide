import { describe, expect, it } from 'vitest';
import { resolvePlace, suggestPlaces } from './placeResolver';

// Real rider phrasing: Jordanian Arabic, English, code-switching and fillers.
const CASES = {
  'أنا بدي أروح على دوار الواحة': 'waha-circle',
  'بدي أروح على جامعة الطفيلة': 'ttu',
  'بدي أروح على الجامعة الأردنية': 'uj',
  'بدي أروح على العقبة': 'aqaba',
  'I want to go to Tafile': 'tafila',
  'uh I want to go to Tafila University': 'ttu',
  'بدي روح عالطفيلة': 'tafila',
  'على الدوار السابع جنب الـ Starbucks': 'circle-7',
  'take me to the 7th circle please': 'circle-7',
  'وديني ع المطار': 'qaia',
  'خذني على البلد': 'amman-downtown',
  'بدي أروح على مكة مول': 'mecca-mall',
  'I want to go to Wadi Rum': 'wadi-rum',
  'وديني على البترا': 'petra',
  'بدي اروح على جامعه اليرموك': 'yarmouk',
  'بدي اروح على التكنو': 'just',
  'بدي أروح على جامعة مؤتة': 'mutah',
  'وديني على الدوار الرابع': 'circle-4',
  'بدي أروح على الزرقاء': 'zarqa',
  'عبدلي بوليفارد': 'abdali-boulevard',
  'بدي اروح على دوار الواحه': 'waha-circle',
  'بدي اروح على الوحة': 'waha-circle',
  'بدي أروح على اربد': 'irbid',
  'بدي أروح على البحر الميت': 'dead-sea',
  'بدي اروح ع الجامعه': 'uj',
  'take me to Aqaba airport': 'aqaba-airport',
  'بدي أروح على الكرك': 'karak',
};

describe('resolvePlace', () => {
  it.each(Object.entries(CASES))('%s → %s', (utterance, expected) => {
    expect(resolvePlace(utterance)?.place.id).toBe(expected);
  });

  it('returns null for places outside Jordan', () => {
    expect(resolvePlace('بدي اروح على المريخ')).toBeNull();
  });

  it('returns null when only filler words are said', () => {
    expect(resolvePlace('uh بدي أروح يعني please')).toBeNull();
  });

  it('offers close alternatives for ambiguous requests', () => {
    const result = resolvePlace('بدي اروح على الطفيلة');
    expect(result.place.id).toBe('tafila');
    expect(result.alternatives.map((a) => a.place.id)).toContain('ttu');
  });

  it('suggests near misses', () => {
    expect(Array.isArray(suggestPlaces('طفيل'))).toBe(true);
  });
});

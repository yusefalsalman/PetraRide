import { JORDAN_PLACES } from '../data/jordanPlaces';

/**
 * On-device destination matcher.
 *
 * Takes a free-form (often code-switched Jordanian Arabic / English) request
 * such as "بدي أروح على جامعة الطفيلة" and returns the best matching place from
 * the Jordan landmark graph, a confidence score, and close alternatives.
 */

// Ordinals: "السابع" / "seventh" / "7" all become the same token.
const ORDINALS = {
  اول: '1', first: '1', 1: '1',
  ثاني: '2', تاني: '2', second: '2', 2: '2',
  ثالث: '3', تالت: '3', third: '3', 3: '3',
  رابع: '4', fourth: '4', 4: '4',
  خامس: '5', fifth: '5', 5: '5',
  سادس: '6', sixth: '6', 6: '6',
  سابع: '7', seventh: '7', seven: '7', 7: '7',
  ثامن: '8', تامن: '8', eighth: '8', 8: '8',
};

// Filler and intent words that never name a place.
const STOPWORDS = new Set(
  [
    // Jordanian / Levantine intent phrases
    'انا', 'احنا', 'بدي', 'بدنا', 'بدك', 'ابغى', 'اريد', 'بغيت', 'حابب', 'حابه', 'نفسي',
    'اروح', 'روح', 'نروح', 'بروح', 'رايح', 'رايحه', 'اوصل', 'توصلني', 'وصلني', 'وصلنا', 'اطلع', 'نطلع',
    'وديني', 'ودينا', 'وديني', 'خذني', 'خدني', 'خذنا', 'خدنا', 'ودي', 'اخذ', 'على', 'علي', 'عل', 'ع', 'الى', 'لعند',
    'عند', 'جنب', 'قريب', 'قرب', 'من', 'في', 'فى', 'هناك', 'هون', 'لو', 'سمحت', 'سمحتي', 'يعطيك', 'العافيه',
    'الله', 'يخليك', 'يا', 'عمو', 'خالتو', 'حبيبي', 'يلا', 'يالله', 'هلا', 'مرحبا', 'السلام', 'عليكم', 'بس', 'يعني',
    'اه', 'اا', 'ام', 'امم', 'اممم', 'طيب', 'ممكن', 'بسرعه', 'الحين', 'هلق', 'هسا', 'هسه', 'اليوم', 'مشوار', 'تكسي',
    'تاكسي', 'سياره', 'رحله', 'او', 'و', 'ال', 'ثم', 'بعدين', 'منطقه', 'مكان',
    // English fillers
    'i', 'id', 'want', 'wanna', 'would', 'like', 'need', 'to', 'go', 'going', 'get', 'take', 'me', 'us', 'the', 'a',
    'an', 'please', 'pls', 'plz', 'uh', 'um', 'umm', 'uhh', 'er', 'hmm', 'ok', 'okay', 'so', 'yalla', 'drive', 'drop',
    'off', 'at', 'near', 'by', 'ride', 'trip', 'can', 'you', 'could', 'from', 'here', 'now', 'there', 'of', 'and', 'or',
    'hey', 'hi', 'hello', 'bring', 'head', 'towards', 'toward', 'into',
  ].map((w) => normalizeToken(w)),
);

/** Normalises Arabic spelling variants and Latin case so matching is forgiving. */
export function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strips attached Arabic prefixes: ال / عال / بال / وال / لل. */
function normalizeToken(token) {
  let t = normalizeText(token);
  if (/^[؀-ۿ]/.test(t) && t.length > 3) {
    if (/^(عال|بال|وال|فال|كال)/.test(t) && t.length > 4) t = t.slice(3);
    else if (t.startsWith('لل') && t.length > 4) t = t.slice(2);
    else if (t.startsWith('ال')) t = t.slice(2);
  }
  return ORDINALS[t] ?? t;
}

export function tokenize(text) {
  return normalizeText(text)
    .split(' ')
    .map(normalizeToken)
    .filter(Boolean);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function tokenSimilarity(a, b) {
  if (a === b) return 1;
  // Short tokens (numbers, "uj") must match exactly.
  if (a.length < 3 || b.length < 3) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Pre-tokenise every alias once.
const INDEX = JORDAN_PLACES.map((place) => {
  const names = [place.name, place.name_ar, ...(place.aliases || [])];
  const aliases = [...new Set(names.map((n) => tokenize(n).join(' ')))]
    .filter(Boolean)
    .map((joined) => joined.split(' '));
  return { place, aliases };
});

function containsSequence(haystack, needle) {
  outer: for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function scoreAlias(queryTokens, alias) {
  // Exact phrase: strongest signal. Longer aliases are more specific, so
  // "جامعة الطفيلة" beats the city "الطفيلة" for the same request.
  if (containsSequence(queryTokens, alias)) {
    return { score: Math.min(1, 0.9 + 0.035 * alias.length), matched: alias.join(' ') };
  }

  // Fuzzy: every alias token needs a close counterpart in the query.
  let total = 0;
  for (const token of alias) {
    let best = 0;
    for (const q of queryTokens) best = Math.max(best, tokenSimilarity(token, q));
    if (best < 0.6) return { score: 0, matched: null };
    total += best;
  }
  const avg = total / alias.length;
  // Penalise single-word fuzzy hits a little more: they are riskier.
  const specificity = alias.length > 1 ? 0.92 : 0.86;
  return { score: avg * specificity, matched: alias.join(' ') };
}

const MATCH_THRESHOLD = 0.62;

/**
 * @returns {{ place, confidence, matched, alternatives: Array<{ place, confidence }> } | null}
 */
export function resolvePlace(text) {
  const all = tokenize(text);
  const queryTokens = all.filter((t) => !STOPWORDS.has(t));
  if (!queryTokens.length) return null;

  const ranked = INDEX.map(({ place, aliases }) => {
    let best = { score: 0, matched: null };
    for (const alias of aliases) {
      const s = scoreAlias(queryTokens, alias);
      if (s.score > best.score) best = s;
    }
    return { place, confidence: best.score, matched: best.matched };
  })
    .filter((r) => r.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  const top = ranked[0];
  if (!top || top.confidence < MATCH_THRESHOLD) return null;

  // Skip runners-up that only matched a generic part of the winning phrase
  // (e.g. "جامعه" alone when the rider said "جامعة الطفيلة"), unless they are
  // the winner's own city.
  const topTokens = new Set(top.matched.split(' '));
  const alternatives = ranked
    .slice(1)
    .filter((r) => r.confidence >= MATCH_THRESHOLD - 0.05 && r.place.id !== top.place.id)
    .filter((r) => {
      const isTopCity = r.place.category === 'city' && r.place.city === top.place.city;
      const onlyGeneric = r.matched.split(' ').every((t) => topTokens.has(t)) && r.matched !== top.matched;
      return isTopCity || !onlyGeneric;
    })
    .slice(0, 3);

  // A bare city name is vague: also offer that city's best-known places.
  if (top.place.category === 'city') {
    for (const place of JORDAN_PLACES) {
      if (alternatives.length >= 3) break;
      if (place.city === top.place.city && place.id !== top.place.id && !alternatives.some((a) => a.place.id === place.id)) {
        alternatives.push({ place, confidence: null });
      }
    }
  }

  return { ...top, alternatives };
}

export function findPlace(id) {
  return JORDAN_PLACES.find((p) => p.id === id) || null;
}

/** Suggestions for when nothing matched: best partial hits, if any. */
export function suggestPlaces(text, limit = 3) {
  const queryTokens = tokenize(text).filter((t) => !STOPWORDS.has(t));
  if (!queryTokens.length) return [];
  return INDEX.map(({ place, aliases }) => {
    let best = 0;
    for (const alias of aliases) {
      for (const token of alias) {
        for (const q of queryTokens) best = Math.max(best, tokenSimilarity(token, q));
      }
    }
    return { place, best };
  })
    .filter((r) => r.best >= 0.67)
    .sort((a, b) => b.best - a.best)
    .slice(0, limit)
    .map((r) => r.place);
}

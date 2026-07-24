/**
 * Description Validation Service
 *
 * Validates the free-text product description for content quality,
 * entirely with local string/regex logic - no external AI API calls.
 *
 * Rules enforced:
 *  1. No personal information (email, phone, IDs, URLs, @handles)
 *  2. No special characters (including underscore) - letters, numbers,
 *     spaces and basic sentence punctuation only
 *  3. No informal short forms / chat slang (ig, ikr, sry, pls, ...)
 *  4. No usernames / social media handles (instagram, whatsapp, etc.)
 *  5. Description must be topically related to the product name
 *     (must share at least one real word with the name or with a broad
 *     fashion vocabulary - this is intentionally generous so genuine
 *     listings are never falsely rejected)
 *  6. No excessive word repetition (spam guard - some repetition is fine)
 *
 * Every violation returns a specific error string naming exactly what
 * was wrong, so the user knows precisely what to fix.
 *
 * @module services/descriptionValidation
 */

const CONSTANTS = require('../constants');

/**
 * Tokenize text into lowercase word tokens (letters/numbers only).
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []);
}

/**
 * Check for personal information (email, phone, URL, @handle, ID numbers).
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkPersonalInfo(description) {
  const errors = [];
  const matches = [];

  for (const pattern of CONSTANTS.PERSONAL_INFO_PATTERNS) {
    const found = description.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  if (matches.length > 0) {
    const unique = [...new Set(matches)];
    errors.push(
      `${CONSTANTS.MESSAGES.PERSONAL_INFO_DETECTED} Found: ${unique.join(', ')}`
    );
  }

  return errors;
}

/**
 * Check for disallowed special characters (anything other than letters,
 * numbers, spaces, and . , ! ? ' -). Underscore is explicitly disallowed.
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkSpecialCharacters(description) {
  const matches = description.match(CONSTANTS.DESCRIPTION_DISALLOWED_CHAR_REGEX);

  if (!matches || matches.length === 0) {
    return [];
  }

  const uniqueChars = [...new Set(matches)]
    .map((c) => (c === ' ' ? '(space)' : c))
    .join(' ');

  return [
    CONSTANTS.MESSAGES.SPECIAL_CHARACTERS_DETECTED.replace('{chars}', uniqueChars)
  ];
}

/**
 * Check for informal short-form / slang words (whole-word match only,
 * so e.g. "sign" is not flagged just because it contains "ig").
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkSlang(description) {
  const words = tokenize(description);
  const slangSet = new Set(CONSTANTS.SLANG_WORDS.map((w) => w.toLowerCase()));

  const foundSlang = [...new Set(words.filter((w) => slangSet.has(w)))];

  if (foundSlang.length === 0) {
    return [];
  }

  return [
    CONSTANTS.MESSAGES.SLANG_DETECTED.replace('{words}', foundSlang.join(', '))
  ];
}

/**
 * Check for usernames / social media handle references beyond the basic
 * @handle / URL patterns already covered by checkPersonalInfo.
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkUsernames(description) {
  for (const pattern of CONSTANTS.SOCIAL_MEDIA_PATTERNS) {
    const found = description.match(pattern);
    if (found) {
      return [
        CONSTANTS.MESSAGES.USERNAME_DETECTED.replace('{match}', found[0].trim())
      ];
    }
  }
  return [];
}

/**
 * Check the description is at least loosely related to the product name.
 * Passes as soon as ANY meaningful word overlaps with the name or with
 * the broad fashion vocabulary list - intentionally lenient to avoid
 * false positives on legitimate listings.
 * @param {string} name
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkRelevance(name, description) {
  const stopwords = new Set(CONSTANTS.STOPWORDS);
  const fashionVocab = new Set(CONSTANTS.FASHION_VOCAB);

  const nameWords = tokenize(name).filter((w) => w.length > 1 && !stopwords.has(w));
  const descWords = tokenize(description).filter((w) => w.length > 1 && !stopwords.has(w));

  if (descWords.length === 0) {
    return []; // handled separately by required/empty checks
  }

  const nameWordSet = new Set(nameWords);

  const hasOverlap = descWords.some((w) => nameWordSet.has(w) || fashionVocab.has(w));

  if (!hasOverlap) {
    return [
      CONSTANTS.MESSAGES.DESCRIPTION_NOT_RELEVANT.replace('{name}', name)
    ];
  }

  return [];
}

/**
 * Check for excessive repetition of a single word (spam guard). Some
 * repetition is normal in product descriptions, so this only fires when
 * one word dominates the text.
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkRepetition(description) {
  const stopwords = new Set(CONSTANTS.STOPWORDS);
  const words = tokenize(description).filter((w) => w.length > 1 && !stopwords.has(w));

  if (words.length < CONSTANTS.MIN_WORDS_FOR_REPETITION_CHECK) {
    return [];
  }

  const counts = new Map();
  for (const w of words) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  for (const [word, count] of counts.entries()) {
    if (count / words.length > CONSTANTS.MAX_WORD_REPETITION_RATIO) {
      return [
        CONSTANTS.MESSAGES.EXCESSIVE_REPETITION.replace('{word}', word)
      ];
    }
  }

  return [];
}

/**
 * Check for unallowed raw numbers or digit sequences (e.g. "23232323", "9876543").
 * Only valid sizes (e.g. Size 10), measurements (e.g. 30cm, 100%), years (1990-2030),
 * or small count numbers (1-10) are allowed.
 * @param {string} text
 * @returns {string[]} error messages
 */
function checkUnallowedNumbers(text) {
  const tokens = text.match(/[a-z0-9%']+/gi) || [];
  const invalidNumbers = [];

  const allowedUnits = new Set([
    'cm', 'm', 'mm', 'in', 'inch', 'inches', 'ft', 'foot', 'feet',
    'kg', 'g', 'lb', 'lbs', 'oz', '%', 'pct', 'percent',
    's', 'v', 'pack', 'piece', 'pieces', 'pair', 'pairs', 'set', 'sets',
    'way', 'ply', 'gen', 'xl', 'xxl', '3xl', 'xs'
  ]);

  const sizeContextWords = new Set([
    'size', 'sizes', 'bust', 'waist', 'hips', 'chest', 'height', 'width', 'length',
    'depth', 'fit', 'fits', 'level', 'grade', 'model', 'type', 'lot', 'pack', 'set'
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toLowerCase();
    
    if (!/\d/.test(token)) continue;

    const digitsOnly = token.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      invalidNumbers.push(token);
      continue;
    }

    if (/^\d+$/.test(token)) {
      const num = parseInt(token, 10);

      if (token.length === 4 && num >= 1900 && num <= 2030) continue;

      const prevToken = i > 0 ? tokens[i - 1].toLowerCase() : '';
      const nextToken = i < tokens.length - 1 ? tokens[i + 1].toLowerCase() : '';

      if (sizeContextWords.has(prevToken)) continue;
      if (allowedUnits.has(nextToken)) continue;

      if (num >= 1 && num <= 10 && token.length <= 2) continue;

      invalidNumbers.push(token);
      continue;
    }

    const match = token.match(/^(\d+)([a-z%]+)$/);
    if (match) {
      const [, digits, unit] = match;
      
      if (allowedUnits.has(unit)) continue;
      if (digits.length <= 2 && (unit === 's' || unit === 'th' || unit === 'st' || unit === 'nd' || unit === 'rd')) continue;

      invalidNumbers.push(token);
      continue;
    }

    invalidNumbers.push(token);
  }

  if (invalidNumbers.length > 0) {
    const unique = [...new Set(invalidNumbers)];
    return [
      (CONSTANTS.MESSAGES.UNALLOWED_NUMBERS_DETECTED || 'Text contains unallowed or random numbers: "{numbers}". Only valid sizes (e.g. Size 10), measurements (e.g. 30cm, 100%), or years (e.g. 1990s) are allowed.').replace('{numbers}', unique.join(', '))
    ];
  }

  return [];
}

/**
 * Check for abnormal, misspelled, or non-standard words (e.g. gibberish, "fondition", "rheaasinghall").
 * @param {string} description
 * @returns {string[]} error messages
 */
function checkAbnormalWords(description) {
  const commonSet = new Set([
    ...(CONSTANTS.COMMON_WORDS || []),
    ...(CONSTANTS.FASHION_VOCAB || []),
    ...(CONSTANTS.STOPWORDS || [])
  ].map((w) => w.toLowerCase()));

  const words = tokenize(description);
  const abnormal = [];

  for (const rawWord of words) {
    const w = rawWord.toLowerCase();

    // If word contains digits, defer digit validation to checkUnallowedNumbers
    if (/\d/.test(w)) continue;

    // Single letter words
    if (w.length === 1) continue;

    // Exact dictionary match
    if (commonSet.has(w)) continue;

    // Try basic English suffix stripping (-s, -es, -ed, -ing, -ly, -er, -y)
    let stemFound = false;
    const stems = [
      w.replace(/s$/, ''),
      w.replace(/es$/, ''),
      w.replace(/ed$/, ''),
      w.replace(/ing$/, ''),
      w.replace(/ing$/, 'e'),
      w.replace(/er$/, ''),
      w.replace(/er$/, 'e'),
      w.replace(/ly$/, ''),
      w.replace(/y$/, 'ie'),
      w.replace(/ies$/, 'y')
    ];

    for (const stem of stems) {
      if (stem && commonSet.has(stem)) {
        stemFound = true;
        break;
      }
    }

    if (stemFound) continue;

    abnormal.push(rawWord);
  }

  if (abnormal.length > 0) {
    const uniqueAbnormal = [...new Set(abnormal)];
    return [
      CONSTANTS.MESSAGES.ABNORMAL_WORD_DETECTED.replace('{words}', uniqueAbnormal.join(', '))
    ];
  }

  return [];
}

/**
 * Run content-quality checks on Product Name.
 * @param {string} name - Product name
 * @returns {{isValid: boolean, errors: string[]}}
 */
function validateProductNameContent(name) {
  if (!name || !name.trim()) {
    return { isValid: false, errors: ['Product name is required.'] };
  }

  if (name.trim().length > 100) {
    return { isValid: false, errors: ['Product name must not exceed 100 characters.'] };
  }

  const errors = [
    ...checkPersonalInfo(name),
    ...checkSpecialCharacters(name),
    ...checkSlang(name),
    ...checkUsernames(name),
    ...checkUnallowedNumbers(name),
    ...checkAbnormalWords(name)
  ];

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Run all description content-quality checks.
 * @param {string} name - Product name (used for the relevance check)
 * @param {string} description - Product description
 * @returns {{isValid: boolean, errors: string[]}}
 */
function validateDescriptionContent(name, description) {
  const errors = [
    ...checkPersonalInfo(description),
    ...checkSpecialCharacters(description),
    ...checkSlang(description),
    ...checkUsernames(description),
    ...checkUnallowedNumbers(description),
    ...checkAbnormalWords(description),
    ...checkRelevance(name || '', description),
    ...checkRepetition(description)
  ];

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateProductNameContent,
  validateDescriptionContent
};
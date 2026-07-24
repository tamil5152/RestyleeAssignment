/**
 * Description Validation (client-side mirror)
 *
 * Mirrors backend/src/services/descriptionValidation.js so the user gets
 * instant feedback before hitting submit. The backend re-validates
 * everything again and is the source of truth - this is purely UX.
 *
 * @module utils/descriptionValidation
 */

const DESCRIPTION_DISALLOWED_CHAR_REGEX = /[^A-Za-z0-9\s.,!?'%-]/g;

const SLANG_WORDS = new Set([
  'ig', 'ikr', 'ikd', 'sry', 'pls', 'plz', 'thx', 'ty', 'np', 'idk',
  'imo', 'imho', 'tbh', 'btw', 'omg', 'lol', 'lmao', 'rofl', 'brb',
  'gtg', 'wtf', 'smh', 'fyi', 'asap', 'dm', 'msg', 'ur', 'u', 'r',
  'y', 'k', 'kk', 'nvm', 'wanna', 'gonna', 'gimme', 'cuz', 'coz',
  'bc', 'b4', '2day', '4u', 'gr8', 'luv', 'xoxo', 'hru', 'wyd',
  'hbu', 'ttyl', 'jk', 'nm', 'omw', 'rn', 'atm', 'irl', 'tbf',
  'prz', 'plzz', 'thnx', 'thanx'
]);

const SOCIAL_MEDIA_PATTERNS: RegExp[] = [
  /\b(insta|instagram|ig id|fb|facebook|snap|snapchat|whatsapp|whats\s?app|telegram|\btg\b|twitter)\b[\s:.-]*[A-Za-z0-9._]{2,}/i,
  /\b(dm|message|contact|reach)\s+me\b/i,
  /\bmy\s+(insta|instagram|snap|whatsapp|number|contact)\b/i
];

const PERSONAL_INFO_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /@[A-Za-z0-9_]{3,30}/,
  /https?:\/\/[^\s]+/i,
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'being', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or',
  'but', 'this', 'that', 'these', 'those', 'it', 'its', 'i', 'you',
  'your', 'my', 'me', 'we', 'our', 'they', 'their', 'as', 'so', 'very',
  'just', 'not', 'no', 'has', 'have', 'had', 'will', 'can', 'from',
  'by', 'all', 'some', 'more', 'most', 'one', 'up', 'out', 'if', 'do',
  'does'
]);

const FASHION_VOCAB = new Set([
  'size', 'fit', 'fits', 'fitted', 'color', 'colour', 'colors', 'colours',
  'fabric', 'material', 'cotton', 'wool', 'silk', 'polyester', 'linen',
  'denim', 'leather', 'suede', 'brand', 'worn', 'wear', 'new', 'used',
  'condition', 'zipper', 'zip', 'button', 'buttons', 'sleeve', 'sleeves',
  'waist', 'chest', 'length', 'shoulder', 'sole', 'heel', 'strap',
  'straps', 'pair', 'style', 'design', 'wash', 'washed', 'stitch',
  'stitching', 'pattern', 'print', 'texture', 'shirt', 'tshirt',
  't-shirt', 'jacket', 'jeans', 'dress', 'skirt', 'shoes', 'sneakers',
  'sneaker', 'boots', 'boot', 'bag', 'handbag', 'belt', 'hat', 'cap',
  'scarf', 'sweater', 'sweatshirt', 'hoodie', 'coat', 'trousers',
  'pants', 'shorts', 'top', 'blouse', 'kurta', 'saree', 'sari',
  'ethnic', 'formal', 'casual', 'vintage', 'trendy', 'stylish',
  'comfortable', 'quality', 'original', 'authentic', 'small', 'medium',
  'large', 'xl', 'xxl', 'inch', 'inches', 'cm', 'gently', 'barely',
  'excellent', 'good', 'like', 'looks', 'perfect', 'summer', 'winter',
  'season', 'outfit', 'outerwear', 'footwear', 'accessory', 'accessories'
]);

const MAX_WORD_REPETITION_RATIO = 0.4;
const MIN_WORDS_FOR_REPETITION_CHECK = 6;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) || [];
}

/**
 * Validate a product description client-side. Returns every error found
 * (not just the first) so the user can fix everything in one pass.
 */
export function validateDescriptionContent(name: string, description: string): string[] {
  const errors: string[] = [];

  // Personal info
  const personalInfoMatches: string[] = [];
  for (const pattern of PERSONAL_INFO_PATTERNS) {
    const found = description.match(pattern);
    if (found) personalInfoMatches.push(...found);
  }
  if (personalInfoMatches.length > 0) {
    errors.push(
      `Description contains personal information. Found: ${[...new Set(personalInfoMatches)].join(', ')}`
    );
  }

  // Special characters
  const disallowed = description.match(DESCRIPTION_DISALLOWED_CHAR_REGEX);
  if (disallowed && disallowed.length > 0) {
    const uniqueChars = [...new Set(disallowed)].map((c) => (c === ' ' ? '(space)' : c)).join(' ');
    errors.push(
      `Description contains special characters that are not allowed: ${uniqueChars}. Use only letters, numbers, and basic punctuation (. , ! ? ' -).`
    );
  }

  // Slang / short forms
  const words = tokenize(description);
  const foundSlang = [...new Set(words.filter((w) => SLANG_WORDS.has(w)))];
  if (foundSlang.length > 0) {
    errors.push(
      `Description contains informal short forms that are not allowed: ${foundSlang.join(', ')}. Please write them out in full.`
    );
  }

  // Usernames / social handles
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    const found = description.match(pattern);
    if (found) {
      errors.push(`Description appears to contain a username or social media handle: "${found[0].trim()}". Please remove it.`);
      break;
    }
  }

  // Relevance to product name
  const nameWords = tokenize(name).filter((w) => w.length > 1 && !STOPWORDS.has(w));
  const descWords = words.filter((w) => w.length > 1 && !STOPWORDS.has(w));
  const nameWordSet = new Set(nameWords);
  if (descWords.length > 0) {
    const hasOverlap = descWords.some((w) => nameWordSet.has(w) || FASHION_VOCAB.has(w));
    if (!hasOverlap) {
      errors.push(`Description does not appear to be related to the product name "${name}". Please describe the actual item.`);
    }
  }

  // Excessive repetition
  const repWords = descWords;
  if (repWords.length >= MIN_WORDS_FOR_REPETITION_CHECK) {
    const counts = new Map<string, number>();
    for (const w of repWords) counts.set(w, (counts.get(w) || 0) + 1);
    for (const [word, count] of counts.entries()) {
      if (count / repWords.length > MAX_WORD_REPETITION_RATIO) {
        errors.push(`Description repeats the word "${word}" too many times. Please vary your wording.`);
        break;
      }
    }
  }

  return errors;
}
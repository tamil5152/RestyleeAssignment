/**
 * Description & Product Name Validation (client-side mirror)
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
  /\b(insta|instagram|ig id|fb|facebook|snap|snapchat|whatsapp|whats\s?app|telegram|\btg\b|twitter|tiktok)\b[\s:.-]*[A-Za-z0-9._]{2,}/i,
  /\b(dm|message|contact|reach)\s+(me|us)\b/i,
  /\bmy\s+(insta|instagram|snap|sc|whatsapp|number|contact|username|user|handle|ig)\b/i,
  /\b(username|user name|sc)\s+[:.-]*\s*([a-z0-9._]{3,})/i,
  /\b(check out|follow)\s+(my\s+)?(username|sc|insta|instagram|ig|fb|facebook|snapchat|handle|page)\b/i
];

const PERSONAL_INFO_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /(?:\d[\s.-]*){10,15}/,
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /@[A-Za-z0-9_]{3,30}/,
  /https?:\/\/[^\s]+/i,
  /\b(?:ID|id|passport|license|SSN|social security)[\s:#-]*\d{4,}\b/i,
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

const COMMON_WORDS = new Set([
  'this', 'that', 'item', 'product', 'piece', 'clothing', 'apparel',
  'clothes', 'wear', 'condition', 'excellent', 'good', 'fair', 'poor',
  'new', 'used', 'gently', 'worn', 'never', 'smoke', 'free', 'pet',
  'home', 'clean', 'stain', 'flaw', 'flawless', 'great', 'nice',
  'nicely', 'original', 'authentic', 'genuine', 'brand', 'vintage',
  'retro', 'modern', 'classic', 'stylish', 'trendy', 'casual', 'formal',
  'party', 'work', 'sport', 'summer', 'winter', 'spring', 'fall',
  'autumn', 'season', 'men', 'mens', 'women', 'womens', 'unisex',
  'kids', 'boy', 'boys', 'girl', 'girls', 'height', 'width', 'length',
  'depth', 'bust', 'waist', 'hips', 'size', 'sizes', 'small', 'medium',
  'large', 'xl', 'xxl', 'xs', 's', 'm', 'l', 'natural', 'pure',
  'cotton', 'wool', 'silk', 'linen', 'leather', 'denim', 'polyester',
  'nylon', 'spandex', 'rayon', 'fur', 'faux', 'synthetic', 'top',
  'bottom', 'shirt', 'pants', 'jacket', 'coat', 'shoes', 'boots',
  'sneakers', 'sandals', 'heels', 'flats', 'dress', 'skirt', 'sweater',
  'hoodie', 'tshirt', 'blouse', 'shorts', 'bag', 'handbag', 'backpack',
  'belt', 'hat', 'cap', 'scarf', 'gloves', 'glasses', 'watch',
  'jewelry', 'red', 'blue', 'green', 'yellow', 'black', 'white',
  'grey', 'gray', 'pink', 'purple', 'orange', 'brown', 'beige',
  'navy', 'gold', 'silver', 'cream', 'ivory', 'khaki', 'print',
  'pattern', 'striped', 'checkered', 'plaid', 'floral', 'solid',
  'tag', 'tags', 'box', 'receipt', 'fast', 'shipping', 'ship',
  'same', 'day', 'next', 'bundle', 'discount', 'offer', 'offers',
  'price', 'firm', 'cheap', 'deal', 'sale', 'check', 'out', 'other',
  'items', 'listings', 'shop', 'buy', 'sell', 'sold', 'order',
  'contact', 'question', 'questions', 'ask', 'feel', 'details',
  'info', 'description', 'fit', 'fits', 'fitted', 'loose', 'tight',
  'slim', 'oversized', 'cropped', 'sleeveless', 'short', 'long',
  'zipper', 'button', 'buttons', 'pocket', 'pockets', 'hood',
  'lined', 'padded', 'soft', 'warm', 'cozy', 'comfortable', 'comfy',
  'durable', 'sturdy', 'imported', 'local', 'usa', 'uk', 'eu',
  'elegant', 'dry', 'only', 'care', 'wash', 'hand', 'machine',
  'cold', 'gentle', 'line', 'hang', 'tumble', 'iron', 'steam',
  'bleach', 'smooth', 'light', 'heavy', 'stretch', 'breathable',
  'premium', 'luxury', 'beautiful', 'pretty', 'gorgeous', 'cute',
  'cool', 'fancy', 'smart', 'sharp', 'sleek', 'neat', 'fresh',
  'bright', 'dark', 'shade', 'tone', 'style', 'fashion', 'design',
  'designer', 'texture', 'finish', 'lining', 'collar', 'cuff',
  'cuffs', 'sleeve', 'sleeves', 'hem', 'seam', 'seams', 'stitch',
  'stitching', 'strap', 'straps', 'buckle', 'clasp', 'snap',
  'hook', 'tie', 'bow', 'lace', 'ribbon', 'fringe', 'ruffle',
  'ruffles', 'pleat', 'pleats', 'elastic', 'drawstring', 'belted',
  'quilted', 'distressed', 'washed', 'dyed', 'embroidered', 'beaded',
  'sequined', 'printed', 'woven', 'knit', 'knitted', 'crochet',
  'braided', 'patch', 'patches', 'logo', 'graphic', 'emblem',
  'badge', 'crest', 'symbol', 'label', 'name', 'number', 'model',
  'type', 'kind', 'category', 'collection', 'look', 'vibe',
  'aesthetic', 'outfit', 'set', 'pair', 'pack', 'lot', 'bundle',
  'match', 'matching', 'accent', 'trim', 'detail', 'details',
  'feature', 'features', 'front', 'back', 'top', 'bottom', 'inside',
  'outside', 'inner', 'outer', 'upper', 'lower', 'left', 'right',
  'center', 'base', 'edge', 'border', 'layer', 'panel', 'strip',
  'band', 'ring', 'loop', 'chain', 'cord', 'string', 'thread',
  'yarn', 'fiber', 'fabric', 'material', 'blend', 'mixture',
  'combination', 'variety', 'range', 'selection', 'assortment',
  'quality', 'state', 'shape', 'cut', 'silhouette', 'measurement',
  'measurements', 'dimension', 'dimensions', 'weight', 'worth',
  'value', 'rate', 'cost', 'fee', 'charge', 'postage', 'freight',
  'delivery', 'handling', 'return', 'exchange', 'refund',
  'guarantee', 'warranty', 'note', 'notes', 'comment', 'comments',
  'tip', 'gift', 'present', 'gem', 'find', 'bargain', 'made', 'make',
  'blazer', 'activewear', 'canvas', 'tote', 'collection', 'style',
  'look', 'lookbook', 'wardrobe', 'closet', 'edition', 'recycled',
  'true', 'cashmere', 'organic', 'polo', 'cargo', 'chiffon', 'velvet',
  'cardigan', 'puffer', 'jumper', 'high', 'waisted', 'crafted',
  'stitched', 'tailored', 'fitting', 'garment', 'garments', 'midi',
  'mini', 'maxi', 'tunic', 'romper', 'onesie', 'bodysuit', 'overalls',
  'jumpsuit', 'kimono', 'kaftan', 'poncho', 'shawl', 'vest', 'shrug'
]);

const MAX_WORD_REPETITION_RATIO = 0.4;
const MIN_WORDS_FOR_REPETITION_CHECK = 6;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) || [];
}

/**
 * Check for unallowed raw numbers or digit sequences.
 */
function checkUnallowedNumbers(text: string): string[] {
  const tokens = text.match(/[a-z0-9%']+/gi) || [];
  const invalidNumbers: string[] = [];

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
      `Text contains unallowed or random numbers: "${unique.join(', ')}". Only valid sizes (e.g. Size 10), measurements (e.g. 30cm, 100%), or years (e.g. 1990s) are allowed.`
    ];
  }

  return [];
}

/**
 * Validate Product Name client-side.
 */
export function validateProductNameContent(name: string): string[] {
  const errors: string[] = [];
  const trimmed = name.trim();

  if (!trimmed) {
    return ['Product name is required.'];
  }
  if (trimmed.length > 100) {
    return ['Product name must not exceed 100 characters.'];
  }

  // Personal info
  for (const pattern of PERSONAL_INFO_PATTERNS) {
    const found = trimmed.match(pattern);
    if (found) {
      errors.push(`Product name contains personal information or numbers: "${found[0].trim()}".`);
      break;
    }
  }

  // Special characters
  const disallowed = trimmed.match(DESCRIPTION_DISALLOWED_CHAR_REGEX);
  if (disallowed && disallowed.length > 0) {
    const uniqueChars = [...new Set(disallowed)].map((c) => (c === ' ' ? '(space)' : c)).join(' ');
    errors.push(`Product name contains disallowed special characters: ${uniqueChars}.`);
  }

  // Slang
  const words = tokenize(trimmed);
  const foundSlang = [...new Set(words.filter((w) => SLANG_WORDS.has(w)))];
  if (foundSlang.length > 0) {
    errors.push(`Product name contains informal short forms: ${foundSlang.join(', ')}.`);
  }

  // Usernames / handles
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    const found = trimmed.match(pattern);
    if (found) {
      errors.push(`Product name contains a username or social handle: "${found[0].trim()}".`);
      break;
    }
  }

  // Unallowed numbers
  errors.push(...checkUnallowedNumbers(trimmed));

  // Abnormal words
  const combinedDict = new Set([...COMMON_WORDS, ...FASHION_VOCAB, ...STOPWORDS]);
  const abnormal: string[] = [];

  for (const rawWord of words) {
    const w = rawWord.toLowerCase();
    if (/\d/.test(w)) continue;
    if (w.length === 1) continue;
    if (combinedDict.has(w)) continue;

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
      if (stem && combinedDict.has(stem)) {
        stemFound = true;
        break;
      }
    }

    if (!stemFound) {
      abnormal.push(rawWord);
    }
  }

  if (abnormal.length > 0) {
    errors.push(`Product name contains abnormal word(s): "${[...new Set(abnormal)].join(', ')}".`);
  }

  return errors;
}

/**
 * Validate a product description client-side. Returns every error found.
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

  // Unallowed numbers
  errors.push(...checkUnallowedNumbers(description));

  // Abnormal / misspelled words
  const combinedDict = new Set([...COMMON_WORDS, ...FASHION_VOCAB, ...STOPWORDS]);
  const abnormal: string[] = [];

  for (const rawWord of words) {
    const w = rawWord.toLowerCase();
    if (/\d/.test(w)) continue;
    if (w.length === 1) continue;
    if (combinedDict.has(w)) continue;

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
      if (stem && combinedDict.has(stem)) {
        stemFound = true;
        break;
      }
    }

    if (!stemFound) {
      abnormal.push(rawWord);
    }
  }

  if (abnormal.length > 0) {
    errors.push(`Description contains abnormal or misspelled word(s): "${[...new Set(abnormal)].join(', ')}". Please use standard words.`);
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
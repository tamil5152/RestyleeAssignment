/**
 * Application Constants
 * Centralized configuration values for the Restylee backend
 * 
 * @module constants
 */

const path = require('path');

const CONSTANTS = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS
 CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://restylee-assignment-61ky.vercel.app',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_PRODUCT: parseInt(process.env.MAX_IMAGES_PER_PRODUCT, 10) || 5,
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/products'),

  // Allowed Image Formats
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],

  // Image Dimensions
  MIN_IMAGE_WIDTH: 200,
  MIN_IMAGE_HEIGHT: 200,
  MAX_IMAGE_WIDTH: 8000,
  MAX_IMAGE_HEIGHT: 8000,

  // Fashion Detection (heuristic fallback, used only if the local ML model
  // fails to load - see services/fashionClassifier.js)
  FASHION_CONFIDENCE_THRESHOLD: 0.6,

  // Fashion Detection (local MobileNet ML model - no external API calls)
  // Minimum probability the top matching ImageNet class must have for us
  // to accept the image as a fashion product.
  FASHION_ML_CONFIDENCE_THRESHOLD: 0.15,

  // Portrait/headshot guard (local pixel heuristic, no external API):
  // fraction of skin-tone pixels in the upper-center region above which
  // an image is treated as a close-up face/portrait rather than a
  // standalone product photo.
  PORTRAIT_SKIN_RATIO_THRESHOLD: 0.28,

  // Subset of the 1000 standard ImageNet classes (as returned by MobileNet)
  // that correspond to clothing, footwear, bags, or accessories. Matching
  // is done as a lowercase substring match against the model's predicted
  // class name, so a partial label like 'jersey' matches
  // the full class string 'jersey, T-shirt'.
  FASHION_IMAGENET_CLASSES: [
    'jersey', 't-shirt', 'cardigan', 'sweatshirt', 'suit', 'gown',
    'academic gown', 'kimono', 'poncho', 'sarong', 'miniskirt', 'bikini',
    'brassiere', 'bra', 'bandeau', 'sock', 'windsor tie', 'bow tie',
    'bowtie', 'bolo tie', 'trench coat', 'overskirt', 'apron', 'lab coat',
    'pajama', 'pyjama', 'abaya', 'shower cap', 'bonnet', 'cowboy hat',
    'ten-gallon hat', 'sombrero', 'mortarboard', 'ski mask', 'fur coat',
    'stole', 'feather boa', 'boa', 'sunglass', 'wig', 'vestment',
    'military uniform', 'cloak', 'necklace', 'crash helmet',
    'football helmet', 'mask', 'bulletproof vest', 'pickelhaube',
    'chain mail', 'breastplate', 'loafer', 'running shoe', 'clog',
    'sandal', 'christmas stocking', 'backpack', 'knapsack', 'rucksack',
    'purse', 'shopping basket', 'mailbag', 'sleeping bag', 'messenger bag',
    'buckle', 'bow', 'wallet', 'billfold', 'umbrella', 'jean', 'denim',
    'swimming trunk', 'bathing trunk', 'maillot', 'diaper', 'perfume',
    'hoopskirt', 'crinoline', 'hair slide', 'bathing cap'
  ],

  // Text Detection (OCR)
  TEXT_CONFIDENCE_THRESHOLD: 60,
  MIN_TEXT_LENGTH_TO_REJECT: 3,

  // Personal Information Patterns
  PERSONAL_INFO_PATTERNS: [
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    // Phone numbers (various formats including spaced out digits like "9 9 8 2 3 3 2 2 2 2")
    /(?:\d[\s.-]*){10,15}/,
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    // Social media handles
    /@[A-Za-z0-9_]{3,30}/,
    // URLs
    /https?:\/\/[^\s]+/i,
    // ID numbers (generic patterns)
    /\b(?:ID|id|passport|license|SSN|social security)[\s:#-]*\d{4,}\b/i,
  ],

  // --- Description content-quality rules ---

  // Only plain letters, numbers, spaces and basic sentence punctuation are
  // allowed. Underscores and every other symbol (@ # $ % ^ & * etc.) are
  // rejected, per requirement.
  DESCRIPTION_ALLOWED_CHARS_REGEX: /^[A-Za-z0-9\s.,!?'%-]*$/,
  // Used to report exactly which characters were disallowed.
  DESCRIPTION_DISALLOWED_CHAR_REGEX: /[^A-Za-z0-9\s.,!?'%-]/g,

  // Chat-speak / short forms that aren't acceptable in a product listing.
  // Checked as whole words, case-insensitive.
  SLANG_WORDS: [
    'ig', 'ikr', 'ikd', 'sry', 'pls', 'plz', 'thx', 'ty', 'np', 'idk',
    'imo', 'imho', 'tbh', 'btw', 'omg', 'lol', 'lmao', 'rofl', 'brb',
    'gtg', 'wtf', 'smh', 'fyi', 'asap', 'dm', 'msg', 'ur', 'u', 'r',
    'y', 'k', 'kk', 'nvm', 'wanna', 'gonna', 'gimme', 'cuz', 'coz',
    'bc', 'b4', '2day', '4u', 'gr8', 'luv', 'xoxo', 'hru', 'wyd',
    'hbu', 'ttyl', 'jk', 'nm', 'omw', 'rn', 'atm', 'irl', 'tbf',
    'prz', 'plzz', 'thnx', 'thanx'
  ],

  // Words/phrases that typically precede or indicate a social handle or
  // contact request that isn't already caught by @handle / URL patterns.
  SOCIAL_MEDIA_PATTERNS: [
    /\b(insta|instagram|ig id|fb|facebook|snap|snapchat|whatsapp|whats\s?app|telegram|\btg\b|twitter|tiktok)\b[\s:.-]*[A-Za-z0-9._]{2,}/i,
    /\b(dm|message|contact|reach)\s+(me|us)\b/i,
    /\bmy\s+(insta|instagram|snap|sc|whatsapp|number|contact|username|user|handle|ig)\b/i,
    /\b(username|user name|sc)\s+[:.-]*\s*([a-z0-9._]{3,})/i,
    /\b(check out|follow)\s+(my\s+)?(username|sc|insta|instagram|ig|fb|facebook|snapchat|handle|page)\b/i
  ],

  // Common English stopwords, excluded when checking topical relevance /
  // word repetition so short connector words don't skew the result.
  STOPWORDS: [
    'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
    'being', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or',
    'but', 'this', 'that', 'these', 'those', 'it', 'its', 'i', 'you',
    'your', 'my', 'me', 'we', 'our', 'they', 'their', 'as', 'so', 'very',
    'just', 'not', 'no', 'has', 'have', 'had', 'will', 'can', 'from',
    'by', 'all', 'some', 'more', 'most', 'one', 'up', 'out', 'if', 'do',
    'does'
  ],

  // Broad fashion/marketplace vocabulary. A description is only flagged
  // as "unrelated" if it shares NO word at all with either the product
  // name or this list, so genuine listings are never falsely blocked.
  FASHION_VOCAB: [
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
  ],

  COMMON_WORDS: [
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
    'tip', 'gift', 'present', 'gem', 'find', 'bargain'
  ],

  // Word-repetition spam guard: if one meaningful word makes up more than
  // this fraction of all meaningful words in the description, it's
  // flagged as excessive (not zero-tolerance - some repetition is normal).
  MAX_WORD_REPETITION_RATIO: 0.4,
  MIN_WORDS_FOR_REPETITION_CHECK: 6,

  // Validation Messages
  MESSAGES: {
    INVALID_FILE_TYPE: 'Only JPG, JPEG, and PNG images are allowed.',
    FILE_TOO_LARGE: 'Image size must not exceed 5MB.',
    TOO_MANY_IMAGES: 'Maximum {max} images allowed per product.',
    IMAGE_TOO_SMALL: 'Image dimensions must be at least {minWidth}x{minHeight} pixels.',
    IMAGE_TOO_LARGE: 'Image dimensions must not exceed {maxWidth}x{maxHeight} pixels.',
    NOT_FASHION_IMAGE: 'The uploaded image does not appear to contain a fashion product. Please upload images of clothing, footwear, bags, or accessories.',
    NOT_PRODUCT_PORTRAIT: 'The uploaded image looks like a close-up face/portrait photo rather than a standalone product image. Please upload a photo of the item itself (flat lay, hanger, mannequin, or clearly framed) without a face filling the frame.',
    TEXT_DETECTED: 'Images containing text are not allowed. Please upload clean product images without text overlays, watermarks, or captions.',
    PERSONAL_INFO_DETECTED: 'Product description contains personal information (email, phone, social media, or IDs). Please remove it before submitting.',
    SPECIAL_CHARACTERS_DETECTED: 'Description contains special characters that are not allowed: {chars}. Use only letters, numbers, and basic punctuation (. , ! ? \' -).',
    SLANG_DETECTED: 'Description contains informal short forms that are not allowed: {words}. Please write them out in full.',
    USERNAME_DETECTED: 'Description appears to contain a username or social media handle: "{match}". Please remove it.',
    ABNORMAL_WORD_DETECTED: 'Description contains abnormal or misspelled word(s): "{words}". Please use standard words.',
    DESCRIPTION_NOT_RELEVANT: 'Description does not appear to be related to the product name "{name}". Please describe the actual item.',
    EXCESSIVE_REPETITION: 'Description repeats the word "{word}" too many times. Please vary your wording.',
    MIN_IMAGES_REQUIRED: 'At least 2 product images are required.',
    NAME_REQUIRED: 'Product name is required.',
    NAME_TOO_LONG: 'Product name must not exceed 100 characters.',
    DESCRIPTION_REQUIRED: 'Product description is required.',
    DESCRIPTION_TOO_LONG: 'Product description must not exceed 2000 characters.',
    SUBMISSION_BLOCKED: 'Please fix all image validation errors before submitting.',
  }
};

module.exports = CONSTANTS;
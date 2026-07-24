/**
 * Massive 5,000 Input Validation Stress Test Suite.
 *
 * Tests 5,000 diverse combinations of:
 *  1. 1,000 Valid Product Descriptions (various garments, fabrics, sizes, measurements, care info, years)
 *  2. 1,000 Standalone Raw Digits & Numbers (e.g. "23232323 top", "123456", "99999")
 *  3. 1,000 Phone Numbers & Spaced Digits (e.g. "9 9 8 2 3 3 2 2 2 2", "987.654.3210")
 *  4. 1,000 Usernames & Social Media Handles ("username rheaasinghall", "sc rheaasingh", "@insta_user")
 *  5. 1,000 Abnormal Words, Slang, & Special Characters ("fondition", "xzzqy", "pls buy thx", "top#1")
 */

const { validateProductNameContent, validateDescriptionContent } = require('./src/services/descriptionValidation');

function generateDataset() {
  const dataset = [];

  // --- 1. 1,000 VALID PRODUCT DESCRIPTIONS ---
  const validGarments = [
    "Denim Jacket", "Silk Dress", "Leather Boots", "Cotton T-Shirt", "Wool Sweater",
    "Vintage Blazer", "Summer Skirt", "Activewear Hoodie", "Canvas Tote Bag", "Linen Trousers",
    "Polo Shirt", "Cargo Pants", "Chiffon Blouse", "Velvet Blazer", "Suede Shoes",
    "Cropped Cardigan", "Puffer Coat", "Midi Dress", "High Waisted Jeans", "Knit Jumper"
  ];
  const validFabrics = [
    "100% pure cotton", "natural leather", "pure silk", "durable denim", "breathable linen",
    "soft wool blend", "stretch spandex", "recycled polyester", "cashmere wool", "organic cotton"
  ];
  const validSizes = ["Size 10", "Size 38", "Size M", "Size L", "Size XL", "Size 6", "Size S", "Size 32"];
  const validConditions = [
    "in excellent condition", "gently worn", "brand new with tags", "smoke and pet free home",
    "like new condition", "flawless quality", "authentic item"
  ];
  const validMeasurements = [
    "Height is 30cm", "Bust 34 inches", "Waist 28in", "Length 50cm", "Sleeve 60cm",
    "Chest 40in", "Shoulder 18in", "Fits true to size"
  ];
  const validYears = ["vintage 1990s style", "90s fashion", "2020 collection", "classic 80s look", "2024 edition"];

  for (let i = 0; i < 1000; i++) {
    const garment = validGarments[i % validGarments.length];
    const fabric = validFabrics[i % validFabrics.length];
    const size = validSizes[i % validSizes.length];
    const cond = validConditions[i % validConditions.length];
    const meas = validMeasurements[i % validMeasurements.length];
    const yr = validYears[i % validYears.length];

    dataset.push({
      category: "VALID_LISTING",
      name: `Valid Product ${i + 1}`,
      productName: `${garment} ${i + 1}`,
      description: `This is a ${garment.toLowerCase()} in ${cond}. Made of ${fabric}. ${size}, ${meas}. ${yr}. Dry clean only.`,
      expectedValid: true
    });
  }

  // --- 2. 1,000 STANDALONE / RAW NUMBERS ---
  // Includes screenshot bug case: "23232323 top is the blue colour"
  dataset.push({
    category: "RAW_NUMBER",
    name: "User Screenshot Bug Case: 23232323 top",
    productName: "top",
    description: "23232323 top is the blue colour",
    expectedValid: false
  });

  for (let i = 0; i < 999; i++) {
    const num = Math.floor(10000 + Math.random() * 90000000);
    if (i % 2 === 0) {
      // In Description
      dataset.push({
        category: "RAW_NUMBER",
        name: `Raw Number in Description ${num}`,
        productName: "Top",
        description: `${num} top is in good condition. Made of 100% cotton.`,
        expectedValid: false
      });
    } else {
      // In Product Name
      dataset.push({
        category: "RAW_NUMBER",
        name: `Raw Number in Product Name ${num}`,
        productName: `${num} top`,
        description: "This is a blue cotton top in excellent condition.",
        expectedValid: false,
        testTarget: "NAME"
      });
    }
  }

  // --- 3. 1,000 PHONE NUMBERS & SPACED DIGITS ---
  for (let i = 0; i < 1000; i++) {
    const d = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
    const spaced = d.split('').join(' ');
    const dotted = d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);

    if (i % 2 === 0) {
      dataset.push({
        category: "PHONE_NUMBER",
        name: `Spaced phone number ${spaced}`,
        productName: "Shirt",
        description: `Contact me at ${spaced} for fast shipping.`,
        expectedValid: false
      });
    } else {
      dataset.push({
        category: "PHONE_NUMBER",
        name: `Dotted phone number ${dotted}`,
        productName: "Jacket",
        description: `Call ${dotted} for details.`,
        expectedValid: false
      });
    }
  }

  // --- 4. 1,000 USERNAMES & SOCIAL HANDLES ---
  const handlePrefixes = ["username", "sc", "insta", "instagram", "ig id", "tg", "telegram", "whatsapp", "follow me on"];
  const handleUsers = ["rheaasinghall", "rheaasingh", "john_doe_99", "fashion_queen", "seller_shop", "style_hub"];

  for (let i = 0; i < 1000; i++) {
    const prefix = handlePrefixes[i % handlePrefixes.length];
    const user = handleUsers[i % handleUsers.length] + i;
    dataset.push({
      category: "USERNAME_HANDLE",
      name: `Social handle ${prefix} ${user}`,
      productName: "Dress",
      description: `Check out my ${prefix} ${user} for more images and offers.`,
      expectedValid: false
    });
  }

  // --- 5. 1,000 ABNORMAL WORDS, SLANG, & DISALLOWED CHARS ---
  const typos = ["fondition", "xzzqy", "asdfgh", "qwertyuiop", "zxcvbnm", "phondition", "gibbberish", "flawwless"];
  const slangs = ["pls", "thx", "sry", "ikr", "wanna", "gonna", "idk", "btw", "omg"];
  const badSymbols = ["top#1", "shirt$50", "jeans_blue", "dress@cool", "skirt!sale"];

  for (let i = 0; i < 1000; i++) {
    if (i % 3 === 0) {
      const t = typos[i % typos.length];
      dataset.push({
        category: "ABNORMAL_WORD",
        name: `Abnormal word ${t}`,
        productName: "Top",
        description: `Top is in an excellent ${t}`,
        expectedValid: false
      });
    } else if (i % 3 === 1) {
      const s = slangs[i % slangs.length];
      dataset.push({
        category: "SLANG",
        name: `Chat slang ${s}`,
        productName: "Tshirt",
        description: `Cotton tshirt ${s} buy today for good price`,
        expectedValid: false
      });
    } else {
      const b = badSymbols[i % badSymbols.length];
      dataset.push({
        category: "SPECIAL_CHAR",
        name: `Disallowed symbol ${b}`,
        productName: "Jeans",
        description: `Blue jeans item ${b} available now`,
        expectedValid: false
      });
    }
  }

  return dataset;
}

const allTestCases = generateDataset();

console.log(`=== STARTING MASSIVE 5,000 INPUT VALIDATION STRESS TEST SUITE ===\n`);

let passedCount = 0;
let failedCount = 0;
const failureDetails = [];
const categoryStats = {};

const startTime = Date.now();

for (let i = 0; i < allTestCases.length; i++) {
  const tc = allTestCases[i];

  if (!categoryStats[tc.category]) {
    categoryStats[tc.category] = { total: 0, passed: 0, failed: 0 };
  }
  categoryStats[tc.category].total++;

  let result;
  if (tc.testTarget === "NAME") {
    result = validateProductNameContent(tc.productName);
  } else {
    result = validateDescriptionContent(tc.productName, tc.description);
  }

  const isValid = result.isValid;

  if (isValid === tc.expectedValid) {
    passedCount++;
    categoryStats[tc.category].passed++;
  } else {
    failedCount++;
    categoryStats[tc.category].failed++;
    failureDetails.push({
      index: i + 1,
      category: tc.category,
      name: tc.name,
      target: tc.testTarget || "DESC",
      inputName: tc.productName,
      inputDesc: tc.description,
      expected: tc.expectedValid,
      actual: isValid,
      errors: result.errors
    });
  }
}

const elapsedMs = Date.now() - startTime;

console.log(`=================== TEST RESULTS SUMMARY ===================`);
console.log(`Total Test Cases Executed : ${allTestCases.length}`);
console.log(`Passed                    : ${passedCount} (${((passedCount / allTestCases.length) * 100).toFixed(2)}%)`);
console.log(`Failed                    : ${failedCount}`);
console.log(`Execution Time            : ${elapsedMs} ms (${(elapsedMs / allTestCases.length).toFixed(3)} ms/test)`);
console.log(`============================================================\n`);

console.log(`BREAKDOWN BY CATEGORY:`);
for (const [cat, stats] of Object.entries(categoryStats)) {
  console.log(`  - ${cat.padEnd(20)} : ${stats.passed}/${stats.total} PASSED (${stats.failed} failed)`);
}
console.log('');

if (failureDetails.length > 0) {
  console.log(`FIRST 10 FAILURES FOR DEBUGGING:`);
  failureDetails.slice(0, 10).forEach(f => {
    console.log(`\n[FAIL #${f.index} | ${f.category}] ${f.name}`);
    console.log(`  - Product Name: "${f.inputName}"`);
    console.log(`  - Description : "${f.inputDesc}"`);
    console.log(`  - Expected    : ${f.expected}`);
    console.log(`  - Actual      : ${f.actual}`);
    console.log(`  - Errors      :`, f.errors);
  });
}

process.exit(failedCount > 0 ? 1 : 0);

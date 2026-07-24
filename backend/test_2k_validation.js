/**
 * Massive 2,000+ Input Validation Test Suite.
 * Heavily stress tests product name & description validation rules against:
 *  - 500 Valid Product Listings (sizes, measurements, care details, fabrics, years)
 *  - 500 Unallowed Random Numbers & Phone Numbers (e.g. "23232323 top", spaced digits)
 *  - 500 Usernames & Social Media Handles (unprefixed, prefixed, phrases)
 *  - 500 Abnormal Words, Slang, & Disallowed Special Characters
 */

const { validateProductNameContent, validateDescriptionContent } = require('./src/services/descriptionValidation');

// Generators for synthetic dataset of 2,000+ test inputs
function generateValidDescriptions() {
  const items = ["Denim Jacket", "Silk Dress", "Leather Boots", "Cotton T-Shirt", "Wool Sweater", "Vintage Blazer", "Summer Skirt", "Activewear Hoodie", "Canvas Tote Bag", "Linen Trousers"];
  const fabrics = ["100% pure cotton", "natural leather", "pure silk", "durable denim", "breathable linen", "soft wool blend"];
  const sizes = ["Size 10", "Size 38", "Size M", "Size L", "Size XL", "Size 6"];
  const conditions = ["in excellent condition", "gently worn", "brand new with tags", "smoke and pet free home", "like new condition"];
  const measurements = ["Height is 30cm", "Bust 34 inches", "Waist 28in", "Length 50cm", "Sleeve 60cm"];
  const years = ["vintage 1990s style", "90s fashion", "2020 collection", "classic 80s look"];

  const list = [];
  for (let i = 0; i < 500; i++) {
    const item = items[i % items.length];
    const fabric = fabrics[i % fabrics.length];
    const size = sizes[i % sizes.length];
    const cond = conditions[i % conditions.length];
    const meas = measurements[i % measurements.length];
    const yr = years[i % years.length];

    list.push({
      type: "VALID",
      name: `${item} ${i + 1}`,
      productName: item,
      description: `This is a ${item.toLowerCase()} in ${cond}. Made of ${fabric}. ${size}, ${meas}. ${yr}.`,
      expectedValid: true
    });
  }
  return list;
}

function generateNumberFailures() {
  const list = [];

  // Screenshot exact bug case: "23232323 top is the blue colour"
  list.push({
    type: "INVALID_NUMBER",
    name: "User Screenshot Bug Case",
    productName: "top",
    description: "23232323 top is the blue colour",
    expectedValid: false
  });

  // Random digit sequences (e.g. 23232323, 123456, 9876543)
  for (let i = 0; i < 200; i++) {
    const num = Math.floor(1000000 + Math.random() * 89999999);
    list.push({
      type: "INVALID_NUMBER",
      name: `Standalone number ${num}`,
      productName: "Top",
      description: `${num} top is in good condition`,
      expectedValid: false
    });
  }

  // Spaced digits (e.g. 9 9 8 2 3 3 2 2 2 2)
  for (let i = 0; i < 150; i++) {
    const spaced = "9 8 7 " + Math.floor(1000 + Math.random() * 9000).toString().split('').join(' ');
    list.push({
      type: "INVALID_NUMBER",
      name: `Spaced phone digits ${i}`,
      productName: "Shirt",
      description: `Call me at ${spaced} for price details`,
      expectedValid: false
    });
  }

  // Random digits in Product Name (e.g. "23232323 top")
  for (let i = 0; i < 150; i++) {
    const num = Math.floor(100000 + Math.random() * 9000000);
    list.push({
      type: "INVALID_NUMBER",
      name: `Number in Product Name ${num}`,
      productName: `${num} top`,
      description: "This is a blue cotton top in excellent condition",
      expectedValid: false,
      testTarget: "NAME"
    });
  }

  return list;
}

function generateUsernameFailures() {
  const list = [];
  const prefixes = ["username", "sc", "insta", "instagram", "ig id", "tg", "telegram", "whatsapp", "dm me on"];
  const users = ["rheaasinghall", "rheaasingh", "john_doe_99", "fashion_queen", "seller_123", "style_shop"];

  for (let i = 0; i < 500; i++) {
    const prefix = prefixes[i % prefixes.length];
    const user = users[i % users.length] + i;
    list.push({
      type: "INVALID_USERNAME",
      name: `Social handle phrase ${prefix} ${user}`,
      productName: "Jacket",
      description: `Check out my ${prefix} ${user} for discount on this jacket`,
      expectedValid: false
    });
  }
  return list;
}

function generateAbnormalAndSlangFailures() {
  const list = [];
  const abnormalWords = ["fondition", "xzzqy", "asdfgh", "qwertyuiop", "zxcvbnm", "phondition", "typoo", "gibbberish"];
  const slangWords = ["pls", "thx", "sry", "ikr", "wanna", "gonna", "idk", "btw", "omg"];
  const badChars = ["top#1", "shirt$50", "jeans_blue", "dress@cool", "skirt!sale"];

  for (let i = 0; i < 500; i++) {
    if (i % 3 === 0) {
      const word = abnormalWords[i % abnormalWords.length];
      list.push({
        type: "ABNORMAL_WORD",
        name: `Abnormal word ${word}`,
        productName: "Top",
        description: `Top is in an excellent ${word}`,
        expectedValid: false
      });
    } else if (i % 3 === 1) {
      const slang = slangWords[i % slangWords.length];
      list.push({
        type: "SLANG",
        name: `Chat slang ${slang}`,
        productName: "Dress",
        description: `Very nice dress ${slang} buy today`,
        expectedValid: false
      });
    } else {
      const char = badChars[i % badChars.length];
      list.push({
        type: "BAD_CHARS",
        name: `Special char ${char}`,
        productName: "Pants",
        description: `Great pants item ${char} available`,
        expectedValid: false
      });
    }
  }
  return list;
}

// Combine all 2,000+ test cases
const allTestCases = [
  ...generateValidDescriptions(),
  ...generateNumberFailures(),
  ...generateUsernameFailures(),
  ...generateAbnormalAndSlangFailures()
];

console.log(`=== RUNNING MASSIVE ${allTestCases.length} INPUT VALIDATION TEST SUITE ===\n`);

let passedCount = 0;
let failedCount = 0;
const failureDetails = [];

const startTime = Date.now();

for (let i = 0; i < allTestCases.length; i++) {
  const tc = allTestCases[i];
  
  let result;
  if (tc.testTarget === "NAME") {
    result = validateProductNameContent(tc.productName);
  } else {
    result = validateDescriptionContent(tc.productName, tc.description);
  }

  const isValid = result.isValid;

  if (isValid === tc.expectedValid) {
    passedCount++;
  } else {
    failedCount++;
    failureDetails.push({
      index: i + 1,
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

console.log(`\n=================== TEST RESULTS SUMMARY ===================`);
console.log(`Total Test Cases Executed : ${allTestCases.length}`);
console.log(`Passed                    : ${passedCount}`);
console.log(`Failed                    : ${failedCount}`);
console.log(`Execution Time            : ${elapsedMs} ms (${(elapsedMs / allTestCases.length).toFixed(2)} ms/test)`);
console.log(`============================================================\n`);

if (failureDetails.length > 0) {
  console.log(`FIRST 10 FAILURES FOR DEBUGGING:`);
  failureDetails.slice(0, 10).forEach(f => {
    console.log(`\n[FAIL #${f.index}] ${f.name}`);
    console.log(`  - Product Name: "${f.inputName}"`);
    console.log(`  - Description : "${f.inputDesc}"`);
    console.log(`  - Expected    : ${f.expected}`);
    console.log(`  - Actual      : ${f.actual}`);
    console.log(`  - Errors      :`, f.errors);
  });
}

process.exit(failedCount > 0 ? 1 : 0);

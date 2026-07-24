/**
 * Heavy test suite for product description validation rules.
 * Runs tests for:
 * 1. Spaced & obfuscated phone numbers
 * 2. Unprefixed & prefixed usernames / social media handles
 * 3. Abnormal / misspelled words
 * 4. Slang & chat short-forms
 * 5. Word repetition
 * 6. Legitimate product listings (with sizes, measurements, fabrics, etc.)
 */

const { validateDescriptionContent } = require('./src/services/descriptionValidation');

const testCases = [
  {
    name: "Unprefixed username 'rheaasinghall'",
    productName: "Top",
    description: "Check out my username rheaasinghall and top is in an excellent condition",
    expectedValid: false,
    expectedErrorSubstring: "username"
  },
  {
    name: "Snapchat prefix 'sc rheaasingh'",
    productName: "Top",
    description: "Check out my sc rheaasingh and top is in an excellent condition",
    expectedValid: false,
    expectedErrorSubstring: "username"
  },
  {
    name: "Spaced phone number '9 9 8 2 3 3 2 2 2 2'",
    productName: "Top",
    description: "My contact number is 9 9 8 2 3 3 2 2 2 2",
    expectedValid: false,
    expectedErrorSubstring: "personal information"
  },
  {
    name: "Hyphenated phone number '987-654-3210'",
    productName: "Tshirt",
    description: "Call or text 987-654-3210 if interested",
    expectedValid: false,
    expectedErrorSubstring: "personal information"
  },
  {
    name: "Abnormal word 'fondition'",
    productName: "Top",
    description: "Top is in an excellent fondition",
    expectedValid: false,
    expectedErrorSubstring: "abnormal or misspelled"
  },
  {
    name: "Gibberish word 'xzzqy'",
    productName: "Denim Jacket",
    description: "Denim jacket with xzzqy buttons and nice style",
    expectedValid: false,
    expectedErrorSubstring: "abnormal or misspelled"
  },
  {
    name: "Social media handle 'insta @fashion_lover'",
    productName: "Dress",
    description: "Follow my insta @fashion_lover for more style tips",
    expectedValid: false,
    expectedErrorSubstring: "personal information"
  },
  {
    name: "Chat slang 'pls buy thx'",
    productName: "Boots",
    description: "Leather boots pls buy thx very good condition",
    expectedValid: false,
    expectedErrorSubstring: "informal short forms"
  },
  {
    name: "Standard valid description",
    productName: "Vintage Denim Jacket",
    description: "This is a vintage denim jacket in excellent condition. Size M, fits nicely. Smoke and pet free home.",
    expectedValid: true
  },
  {
    name: "Description with numbers and measurements",
    productName: "Leather Boots",
    description: "Original brand shoes. Size 10. Natural leather. Height is 30cm.",
    expectedValid: true
  },
  {
    name: "Description with fabric and care details",
    productName: "Silk Dress",
    description: "100% pure silk dress in elegant red. Dry clean only. Fits bust 34 inches.",
    expectedValid: true
  },
  {
    name: "Repetitive spam text",
    productName: "Shirt",
    description: "Shirt shirt shirt shirt shirt shirt shirt shirt shirt shirt",
    expectedValid: false,
    expectedErrorSubstring: "repeats"
  }
];

let failed = 0;

console.log("=== RUNNING HEAVY VALIDATION TEST SUITE ===\n");

for (const tc of testCases) {
  const result = validateDescriptionContent(tc.productName, tc.description);
  const isValid = result.isValid;
  
  let passed = false;
  if (tc.expectedValid) {
    passed = isValid;
  } else {
    passed = !isValid && result.errors.some(err => 
      err.toLowerCase().includes(tc.expectedErrorSubstring.toLowerCase())
    );
  }
  
  if (passed) {
    console.log(`[PASS] ${tc.name}`);
  } else {
    console.log(`[FAIL] ${tc.name}`);
    console.log(`  - Input Description: "${tc.description}"`);
    console.log(`  - Expected Valid: ${tc.expectedValid}`);
    console.log(`  - Actual Valid: ${isValid}`);
    console.log(`  - Actual Errors:`, result.errors);
    failed++;
  }
}

console.log(`\n=== TEST SUMMARY: ${testCases.length - failed}/${testCases.length} PASSED, ${failed} FAILED ===`);
process.exit(failed > 0 ? 1 : 0);

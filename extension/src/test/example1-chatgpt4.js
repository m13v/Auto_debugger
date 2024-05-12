function isValidString(s) {
    // Object to store the frequency of each character
    const charCounts = {};

    // Count each character's occurrences
    for (let char of s) {
        charCounts[char] = (charCounts[char] || 0) + 1;
    }

    // Convert the counts to an array to check if all counts are the same
    const counts = Object.values(charCounts);

    // Check if all counts are the same using every method
    const allSame = counts.every(count => count === counts[0]);
    if (!allSame) {
        return false;
    }

    // Get the keys and sort them to verify alphabetic order and no gaps
    const keys = Object.keys(charCounts).sort();

    // Check for sequential alphabetic order without gaps
    for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i + 1].charCodeAt(0) !== keys[i].charCodeAt(0) + 1) {
            return false;
        }
    }

    // If all checks are passed, return true
    return true;
}

// Test cases
console.log(isValidString("abc"));               // true
console.log(isValidString("abd"));               // false
console.log(isValidString("aabbcc"));            // true
console.log(isValidString("aaabbbccc"));         // true
console.log(isValidString("aaabbbcccc"));        // false
console.log(isValidString("aabbccdd"));          // true
console.log(isValidString("aabbccdde"));         // false
console.log(isValidString("aaaaabbbbbcccccdddddeeeee"));  // true

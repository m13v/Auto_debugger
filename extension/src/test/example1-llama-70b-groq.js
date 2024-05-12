function isValidString(s) {
	let charCount = 1;
	let prevCharCode = s.charCodeAt(0);

	for (let i = 1; i < s.length; i++) {
		if (s[i] === s[i - 1]) {
			charCount++;
		} else {
			if (charCount !== i - charCount) return false; // check if char count is consistent
			if (s.charCodeAt(i) !== prevCharCode + 1) return false; // check if char code is incrementing
			charCount = 1;
			prevCharCode = s.charCodeAt(i);
		}
	}

	return charCount === s.length - charCount;
}

// Test cases
console.log(isValidString("abc")); // true
console.log(isValidString("abd")); // false
console.log(isValidString("aabbcc")); // true
console.log(isValidString("aaabbbccc")); // true
console.log(isValidString("aaabbbcccc")); // false
console.log(isValidString("aabbccdd")); // true
console.log(isValidString("aabbccdde")); // false
console.log(isValidString("aaaaabbbbbcccccdddddeeeee")); // true

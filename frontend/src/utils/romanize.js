/**
 * Shared utility: converts an integer to a Roman numeral string.
 * Used for semester numbering display (Sem I, Sem II, etc.)
 */
export const romanize = (num) => {
  if (!num) return '';
  const lookup = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

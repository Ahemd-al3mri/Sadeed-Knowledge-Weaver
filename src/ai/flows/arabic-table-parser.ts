// Arabic Table Parser Utility
// Parses a markdown-like Arabic table string into a JSON array

/**
 * Parses a markdown-style Arabic table into an array of objects.
 * @param table - The raw table string
 * @returns Array of row objects
 */
export function parseArabicTable(table: string): Array<Record<string, string>> {
  const lines = table
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'));
  if (lines.length < 2) return [];
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  return lines.slice(2).map(row => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
  });
}

// Example usage:
const rawTable = `
| الاسم | الاسم | الم |
| --- | --- | --- |
| وسام آل سعيد | جلالة الملك / لويس فيليب ليوبولد ماري | ١ |
| وسام عمان الأول | جلالة الملك / مـاتيلـد مـاري كريستـين | ٢ |
| وسام نهضة عمان | معـالـي / بيتـــر دي روفــــــر | ٣ |
| (الدرجة الأولى) | دولــــة / ألكسنددر دي كــــرو | ٤ |
| وسام عمان المدني | معـالـي / تيني فان دير سترايتن | ٥ |
| (الدرجة الثانية) | معـالـي / بـرنـــارد كوينـــتن | ٦ |
| وسام نهضة عمان | السفيــر / فينسنت هــاوســـلاو | ٧ |
| (الدرجة الثانية) | السفيــرة / دومينيـــك مينـــور | ٨ |
| وسام عمان العسكري | اللــــواء / لــوك دي مـايسشــالك | ٩ |
| (الدرجة الثانية) | اللــــواء / جــويــــدو هـــــارت | ١٠ |
| وسام نهضة عمان | المستــر / خــافييـــر بيـــــرت | ١١ |
| (الدرجة الثانية) | المستــر / تــوم دي فيشــاويـــر | ١٢ |
`;

// Uncomment to test
// console.log(parseArabicTable(rawTable));

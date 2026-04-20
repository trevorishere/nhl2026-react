/**
 * Normalise a player name for fuzzy matching:
 * lower-case, strip diacritics, trim whitespace.
 */
export function normalizeName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

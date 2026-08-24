/**
 * Global helper to safely get the localized name of a data object.
 *
 * @param {Object|String} item - The object containing translations, or a fallback string.
 *                               Expected structure: { id: "guntur", names: { en: "Guntur", hi: "गुंटूर", ... } }
 * @param {String} language - The selected language code (e.g. 'en', 'hi', 'te', 'ta')
 * @returns {String} The localized name or the safest fallback
 */
export function getLocalizedName(item, language) {
  if (!item) return "";
  
  if (typeof item === "string") {
    return item;
  }
  
  return (
    item.names?.[language] ||
    item.names?.en ||
    item.name ||
    item.id ||
    ""
  );
}

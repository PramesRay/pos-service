export const prefixId = (prefix, id) =>
  Array.isArray(prefix) ? [...prefix, id].join('-') : `${prefix}-${id}`;

// "sft-csh-1" -> "1"
export const getIdFromPrefixed = (val) => {
  if (typeof val !== 'string') return null;
  const idx = val.lastIndexOf('-');
  if (idx === -1) return val; // tidak ada prefix
  const id = val.slice(idx + 1);
  return id || null; // kalau "sft-" -> null
};

// "sft-csh-1" -> 1  |  "sft-csh-abc" -> null
export const getIdNumberFromPrefixed = (val) => {
  const id = getIdFromPrefixed(val);
  if (id == null) return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
};

// decode lengkap: prefix, parts, id(string), idNumber(number|null)
export const decodePrefixedId = (val) => {
  if (typeof val !== 'string') return { prefix: '', parts: [], id: null, idNumber: null };
  const idx = val.lastIndexOf('-');
  const prefix = idx === -1 ? '' : val.slice(0, idx);
  const id = idx === -1 ? val : val.slice(idx + 1);
  const idNumber = id !== '' && Number.isFinite(Number(id)) ? Number(id) : null;
  return { prefix, parts: prefix ? prefix.split('-') : [], id, idNumber };
};
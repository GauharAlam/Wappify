import crypto from "crypto";

export const generateStoreCode = (name: string, withRandomSuffix = false): string => {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10) || "STORE";

  if (!withRandomSuffix) {
    return base;
  }

  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${base}-${suffix}`;
};

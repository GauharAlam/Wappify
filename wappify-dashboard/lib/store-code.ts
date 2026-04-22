export const generateStoreCode = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "STORE";
};

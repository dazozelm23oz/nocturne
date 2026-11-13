export function getLuminanceFromHex(hexOrRgb: string): number {
  if (!hexOrRgb) return 0.1;
  let hex = hexOrRgb.replace("#", "").trim();
  if (hex.startsWith("rgb")) {
    const match = hex.match(/\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(",").map((n) => parseFloat(n.trim()));
      const r = (parts[0] || 0) / 255;
      const g = (parts[1] || 0) / 255;
      const b = (parts[2] || 0) / 255;
      const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
      return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
    }
  }
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = (parseInt(hex.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(hex.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(hex.substring(4, 6), 16) || 0) / 255;
  const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

export function getContrastTextColor(bgColorHex: string): string {
  const lum = getLuminanceFromHex(bgColorHex);
  return lum > 0.45 ? "#111111" : "#ffffff";
}

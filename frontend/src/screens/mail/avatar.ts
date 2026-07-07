const PALETTE = [
  "#c43e1c",
  "#8764b8",
  "#0078d4",
  "#498205",
  "#986f0b",
  "#c239b3",
  "#00767a",
  "#8e562e",
];

function extractDisplayName(sender: string): string {
  const match = sender.match(/^([^<]+)/);
  return (match ? match[1] : sender).trim();
}

export function initials(sender: string): string {
  const name = extractDisplayName(sender);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(sender: string): string {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function senderName(sender: string): string {
  return extractDisplayName(sender);
}

export function extractEmail(sender: string): string {
  const match = sender.match(/<([^>]+)>/);
  return (match ? match[1] : sender).trim();
}

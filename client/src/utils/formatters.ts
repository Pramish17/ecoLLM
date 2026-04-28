export function formatCarbon(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  if (grams >= 1) return `${grams.toFixed(2)} g`;
  return `${(grams * 1000).toFixed(1)} mg`;
}

export function formatEnergy(wh: number): string {
  if (wh >= 1000) return `${(wh / 1000).toFixed(2)} kWh`;
  if (wh >= 1) return `${wh.toFixed(3)} Wh`;
  return `${(wh * 1000).toFixed(2)} mWh`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-GB').format(Math.round(n));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

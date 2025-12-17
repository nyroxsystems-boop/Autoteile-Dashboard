import Badge from './Badge';

type StatusChipProps = {
  status?: string | null;
};

const labelMap: Record<string, string> = {
  choose_language: 'Sprache wählen',
  collect_vehicle: 'Fahrzeugdaten',
  collect_part: 'Teiledaten',
  oem_lookup: 'OEM prüfen',
  show_offers: 'Angebote senden',
  done: 'Abgeschlossen'
};

const getVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  const s = status.toLowerCase();
  if (s === 'show_offers') return 'warning';
  if (s.includes('done') || s.includes('complete') || s.includes('success')) return 'success';
  if (s.includes('fail') || s.includes('error') || s.includes('abort')) return 'danger';
  if (s.includes('collect') || s.includes('oem') || s.includes('choose_language')) return 'warning';
  return 'neutral';
};

const StatusChip = ({ status }: StatusChipProps) => {
  const raw = String(status ?? '').trim();
  const key = raw.toLowerCase();
  const label = labelMap[key] ?? raw ?? '–';
  const variant = raw ? getVariant(raw) : 'neutral';

  return <Badge variant={variant}>{label || '–'}</Badge>;
};

export default StatusChip;


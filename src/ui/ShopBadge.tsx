import Badge from './Badge';

type ShopBadgeProps = {
  shopName?: string | null;
};

const ShopBadge = ({ shopName }: ShopBadgeProps) => {
  const label = (shopName ?? '').trim() || 'Shop';
  return <Badge variant="neutral">{label}</Badge>;
};

export default ShopBadge;


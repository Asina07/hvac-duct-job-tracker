interface StatusBadgeProps {
  status: string;
  color: string;
}

export default function StatusBadge({ status, color }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    pink: 'bg-pink-100 text-pink-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[color] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}
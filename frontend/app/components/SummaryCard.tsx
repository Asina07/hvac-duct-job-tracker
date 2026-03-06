interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function SummaryCard({ 
  title, 
  value, 
  subtitle,
  color = 'blue' 
}: SummaryCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    orange: 'border-l-orange-500',
    red: 'border-l-red-500',
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border-l-4 ${colorMap[color]}`}>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  loading: boolean;
  isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  loading,
  isCurrency = false,
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val);
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className="glass-card p-5 flex items-center justify-between relative overflow-hidden">
      {/* Background flare */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 pointer-events-none"
        style={{ backgroundColor: iconColor }}
      />
      
      <div className="flex flex-col gap-1.5 z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {title}
        </span>
        {loading ? (
          <div className="h-8 w-32 rounded-lg shimmer-bg mt-1" />
        ) : (
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            {formatValue(value)}
          </span>
        )}
      </div>

      <div 
        className="p-3.5 rounded-xl border border-white/5 z-10"
        style={{ 
          backgroundColor: `${iconColor}12`,
          borderColor: `${iconColor}25`
        }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
    </div>
  );
};

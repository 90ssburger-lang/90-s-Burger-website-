import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, change, icon: Icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-muted-foreground">{title}</p>
          <p className="mt-3 whitespace-nowrap font-display text-[clamp(1.5rem,2vw,1.875rem)] font-bold leading-tight tracking-tight text-foreground">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                'mt-3 flex items-start gap-1.5 text-sm leading-5',
                change >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span>{change >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% from last month</span>
            </p>
          )}
        </div>
        <div className={cn('shrink-0 rounded-xl bg-muted p-3', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

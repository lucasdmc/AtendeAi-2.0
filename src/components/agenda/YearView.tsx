import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YearViewProps {
  yearData: Array<{
    month: number;
    name: string;
    agendamentosCount: number;
    growth: number;
    date: Date;
  }>;
  onMonthClick?: (date: Date) => void;
}

const YearView: React.FC<YearViewProps> = ({ yearData, onMonthClick }) => {
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-3 w-3" />;
    if (growth < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthBadgeVariant = (growth: number) => {
    if (growth > 0) return 'default';
    if (growth < 0) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
      {yearData.map((monthData) => (
        <Card
          key={monthData.month}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMonthClick?.(monthData.date)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg capitalize">
              {monthData.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {monthData.agendamentosCount}
              </div>
              <div className="text-sm text-muted-foreground">
                agendamentos
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Badge
                variant={getGrowthBadgeVariant(monthData.growth)}
                className="flex items-center space-x-1"
              >
                {getGrowthIcon(monthData.growth)}
                <span className="text-xs">
                  {monthData.growth > 0 ? '+' : ''}
                  {monthData.growth.toFixed(1)}%
                </span>
              </Badge>
            </div>

            <div className={cn(
              "text-xs text-center",
              getGrowthColor(monthData.growth)
            )}>
              vs mês anterior
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default YearView;
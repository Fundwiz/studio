'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { OptionChain } from '@/lib/types';

const chartConfig = {
  callOi: {
    label: 'Call OI',
    color: 'hsl(var(--chart-1))',
  },
  putOi: {
    label: 'Put OI',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function OpenInterestChart({
  optionChain,
}: {
  optionChain: OptionChain | null;
}) {
  const { chartData } = useMemo(() => {
    if (!optionChain) return { chartData: [] };

    const { calls, puts, underlyingPrice } = optionChain;
    const strikes = [...new Set([...calls.map((c) => c.strike), ...puts.map((p) => p.strike)])].sort((a, b) => a - b);
    const callMap = new Map(calls.map((c) => [c.strike, c]));
    const putMap = new Map(puts.map((p) => [p.strike, p]));

    const processedData = strikes.map((strike) => {
      const call = callMap.get(strike);
      const put = putMap.get(strike);
      return {
        strike: strike,
        callTotalOi: call?.oi ?? 0,
        putTotalOi: put?.oi ?? 0,
      };
    });

    const atmStrike = strikes.reduce((prev, curr) =>
        Math.abs(curr - underlyingPrice) < Math.abs(prev - underlyingPrice) ? curr : prev
    , 0);

    if (atmStrike === 0) {
        return { chartData: processedData };
    }
    
    return { chartData: processedData };
  }, [optionChain]);

  if (!optionChain || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Interest Comparison</CardTitle>
          <CardDescription>No data available to display chart.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Awaiting option chain data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const strikeRange = chartData.length > 0 ? `(${chartData[0].strike} - ${chartData[chartData.length - 1].strike})` : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Interest Comparison {strikeRange}</CardTitle>
        <CardDescription>
          Total Call vs. Put Open Interest at different strike prices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="strike"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}`}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'Open Interest',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  style: { textAnchor: 'middle' },
                }}
                tickFormatter={(value) => `${(value / 1e5).toFixed(0)}L`}
              />
              <Tooltip
                content={<ChartTooltipContent
                  formatter={(value, name) => [
                    `${(Number(value) / 1e5).toFixed(2)}L`,
                     name,
                  ]}
                  labelFormatter={(label) => `Strike: ${label}`}
                />}
              />
              <Legend />
              <Bar
                dataKey="callTotalOi"
                fill="var(--color-callOi)"
                name="Call OI"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="putTotalOi"
                fill="var(--color-putOi)"
                name="Put OI"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

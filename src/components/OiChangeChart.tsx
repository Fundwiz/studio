'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
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
  callChngOi: {
    label: 'Call OI Chng',
    color: 'hsl(var(--chart-1))',
  },
  putChngOi: {
    label: 'Put OI Chng',
    color: 'hsl(var(--chart-2))',
  },
  callChng: {
    label: 'Call Price Chng',
    color: 'hsl(var(--chart-4))',
  },
  putChng: {
    label: 'Put Price Chng',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function OiChangeChart({
  optionChain,
}: {
  optionChain: OptionChain | null;
}) {
  const { chartData, range } = useMemo(() => {
    if (!optionChain) return { chartData: [], range: [0,0] };

    const { calls, puts, underlyingPrice } = optionChain;
    const strikes = [...new Set([...calls.map((c) => c.strike), ...puts.map((p) => p.strike)])].sort((a, b) => a - b);
    
    const atmStrike = strikes.reduce((prev, curr) =>
        Math.abs(curr - underlyingPrice) < Math.abs(prev - underlyingPrice) ? curr : prev
    , 0);

    if (atmStrike === 0) {
        return { chartData: [], range: [0,0] };
    }

    const atmIndex = strikes.findIndex(s => s === atmStrike);
    const startIndex = Math.max(0, atmIndex - 10);
    const endIndex = Math.min(strikes.length, atmIndex + 11);
    const slicedStrikes = strikes.slice(startIndex, endIndex);

    const callMap = new Map(calls.map((c) => [c.strike, c]));
    const putMap = new Map(puts.map((p) => [p.strike, p]));

    const processedData = slicedStrikes.map((strike) => {
      const call = callMap.get(strike);
      const put = putMap.get(strike);
      return {
        strike: strike,
        callChngOi: call?.chngInOI ?? 0,
        putChngOi: put?.chngInOI ?? 0,
        callChng: call?.chng ?? 0,
        putChng: put?.chng ?? 0,
      };
    });

    const rangeText = slicedStrikes.length > 0 ? [slicedStrikes[0], slicedStrikes[slicedStrikes.length-1]] : [0,0];

    return { chartData: processedData, range: rangeText };
  }, [optionChain]);

  if (!optionChain || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OI & Price Change Analysis</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>OI & Price Change Analysis ({range[0]}-{range[1]})</CardTitle>
        <CardDescription>
          Visual analysis of Change in Open Interest and Change in Price across strike prices. This helps in identifying buildups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer>
            <ComposedChart data={chartData}>
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
                yAxisId="left"
                orientation="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Change in OI', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle' } }}
                tickFormatter={(value) => `${(value / 1e3).toFixed(1)}K`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Price Change (₹)', angle: 90, position: 'insideRight', offset: 10, style: { textAnchor: 'middle' } }}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="callChngOi"
                name={chartConfig.callChngOi.label}
                fill={chartConfig.callChngOi.color}
              />
              <Bar
                yAxisId="left"
                dataKey="putChngOi"
                name={chartConfig.putChngOi.label}
                fill={chartConfig.putChngOi.color}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="callChng"
                name={chartConfig.callChng.label}
                stroke={chartConfig.callChng.color}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="putChng"
                name={chartConfig.putChng.label}
                stroke={chartConfig.putChng.color}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

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
  callOi: {
    label: 'Call chng_oi',
    color: 'hsl(200 80% 80%)',
  },
  putOi: {
    label: 'Put chng_oi',
    color: 'hsl(140 60% 35%)',
  },
  callLtp: {
    label: 'Call LTP%',
    color: 'hsl(var(--chart-1))',
  },
  putLtp: {
    label: 'Put LTP%',
    color: 'hsl(270 70% 50%)',
  },
} satisfies ChartConfig;

export function OptionChainChart({
  optionChain,
}: {
  optionChain: OptionChain | null;
}) {
  const chartData = useMemo(() => {
    if (!optionChain) return [];

    const { calls, puts, underlyingPrice } = optionChain;
    const strikes = [...new Set([...calls.map((c) => c.strike), ...puts.map((p) => p.strike)])].sort((a, b) => a - b);
    const callMap = new Map(calls.map((c) => [c.strike, c]));
    const putMap = new Map(puts.map((p) => [p.strike, p]));

    const processedData = strikes.map((strike) => {
      const call = callMap.get(strike);
      const put = putMap.get(strike);

      const callPrevLtp = call ? call.ltp - call.chng : 0;
      const putPrevLtp = put ? put.ltp - put.chng : 0;

      return {
        strike: strike,
        callOi: call?.chngInOI ?? 0,
        putOi: put?.chngInOI ?? 0,
        callLtp: callPrevLtp !== 0 ? (call.chng / callPrevLtp) * 100 : 0,
        putLtp: putPrevLtp !== 0 ? (put.chng / putPrevLtp) * 100 : 0,
      };
    });

    // Filter to show a range of strikes around the underlying price
    const strikeRange = 10;
    const closestStrike = processedData.reduce(
        (prev, curr) => Math.abs(curr.strike - underlyingPrice) < Math.abs(prev.strike - underlyingPrice) ? curr : prev,
        { strike: 0 }
    ).strike;
    
    if (closestStrike === 0) return processedData.slice(0, 20); // Fallback for empty data

    const closestIndex = processedData.findIndex(d => d.strike === closestStrike);
    const startIndex = Math.max(0, closestIndex - strikeRange);
    const endIndex = Math.min(processedData.length, closestIndex + strikeRange + 1);

    return processedData.slice(startIndex, endIndex);

  }, [optionChain]);

  if (!optionChain || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change in OI & LTP%</CardTitle>
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
  const range = [chartData[0].strike, chartData[chartData.length-1].strike]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change in OI & LTP% ({range[0]}-{range[1]})</CardTitle>
        <CardDescription>
          Visual analysis of Open Interest and Price changes across strike
          prices.
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
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Change in OI', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle' } }}
                tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'LTP % Change', angle: 90, position: 'insideRight', offset: 10, style: { textAnchor: 'middle' } }}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="callOi"
                name="Call chnge_oi"
                fill={chartConfig.callOi.color}
                stackId="a"
              />
              <Bar
                yAxisId="left"
                dataKey="putOi"
                name="Put chnge_oi"
                fill={chartConfig.putOi.color}
                stackId="a"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="callLtp"
                name="Call LTP%"
                stroke={chartConfig.callLtp.color}
                strokeWidth={2}
                dot={{ r: 4, fill: chartConfig.callLtp.color }}
                strokeDasharray="5 5"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="putLtp"
                name="Put LTP%"
                stroke={chartConfig.putLtp.color}
                strokeWidth={2}
                dot={{ r: 4, fill: chartConfig.putLtp.color }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

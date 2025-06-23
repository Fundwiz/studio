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
  ReferenceLine,
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
    label: 'Call OI Change',
    color: 'hsl(var(--chart-1))',
  },
  putOi: {
    label: 'Put OI Change',
    color: 'hsl(var(--chart-2))',
  },
  callLtp: {
    label: 'Call LTP%',
    color: 'hsl(var(--chart-4))',
  },
  putLtp: {
    label: 'Put LTP%',
    color: 'hsl(var(--chart-5))',
  },
  support: {
    label: 'Support',
    color: 'hsl(var(--chart-2))',
  },
  resistance: {
    label: 'Resistance',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function OptionChainChart({
  optionChain,
}: {
  optionChain: OptionChain | null;
}) {
  const { chartData, resistance1, resistance2, support1, support2 } = useMemo(() => {
    if (!optionChain) return { chartData: [], resistance1: 0, resistance2: 0, support1: 0, support2: 0 };

    const { calls, puts } = optionChain;
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
        callTotalOi: call?.oi ?? 0,
        putTotalOi: put?.oi ?? 0,
        callLtp: callPrevLtp !== 0 ? (call.chng / callPrevLtp) * 100 : 0,
        putLtp: putPrevLtp !== 0 ? (put.chng / putPrevLtp) * 100 : 0,
      };
    });

    // Sort by OI to find top 2 for support and resistance
    const callsByOi = [...processedData].sort((a, b) => b.callTotalOi - a.callTotalOi);
    const putsByOi = [...processedData].sort((a, b) => b.putTotalOi - a.putTotalOi);

    const resistance1 = callsByOi[0]?.strike ?? 0;
    const resistance2 = callsByOi[1]?.strike ?? 0;
    const support1 = putsByOi[0]?.strike ?? 0;
    const support2 = putsByOi[1]?.strike ?? 0;
    
    return { chartData: processedData, resistance1, resistance2, support1, support2 };

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
  const range = chartData.length > 1 ? [chartData[0].strike, chartData[chartData.length-1].strike] : [0,0];

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
                tickFormatter={(value) => `${(value / 1e5).toFixed(1)}L`}
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
                name={chartConfig.callOi.label}
                fill={chartConfig.callOi.color}
                stackId="a"
              />
              <Bar
                yAxisId="left"
                dataKey="putOi"
                name={chartConfig.putOi.label}
                fill={chartConfig.putOi.color}
                stackId="a"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="callLtp"
                name={chartConfig.callLtp.label}
                stroke={chartConfig.callLtp.color}
                strokeWidth={2}
                dot={{ r: 4, fill: chartConfig.callLtp.color }}
                strokeDasharray="5 5"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="putLtp"
                name={chartConfig.putLtp.label}
                stroke={chartConfig.putLtp.color}
                strokeWidth={2}
                dot={{ r: 4, fill: chartConfig.putLtp.color }}
                strokeDasharray="5 5"
              />

              <ReferenceLine
                yAxisId="left"
                x={support1}
                stroke={chartConfig.support.color}
                strokeDasharray="4 4"
                ifOverflow="visible"
                label={{ value: `S1`, position: 'insideTopLeft', fill: chartConfig.support.color, fontSize: 12 }}
              />
              <ReferenceLine
                yAxisId="left"
                x={support2}
                stroke={chartConfig.support.color}
                strokeDasharray="2 6"
                ifOverflow="visible"
                label={{ value: `S2`, position: 'insideTopLeft', dy: 15, fill: chartConfig.support.color, fontSize: 12 }}
              />
               <ReferenceLine
                yAxisId="left"
                x={resistance1}
                stroke={chartConfig.resistance.color}
                strokeDasharray="4 4"
                ifOverflow="visible"
                label={{ value: `R1`, position: 'insideTopRight', fill: chartConfig.resistance.color, fontSize: 12 }}
              />
              <ReferenceLine
                yAxisId="left"
                x={resistance2}
                stroke={chartConfig.resistance.color}
                strokeDasharray="2 6"
                ifOverflow="visible"
                label={{ value: `R2`, position: 'insideTopRight', dy: 15, fill: chartConfig.resistance.color, fontSize: 12 }}
              />
              <Line yAxisId="left" dataKey="dummyS1" name={`Support 1 @ ${support1}`} stroke={chartConfig.support.color} strokeDasharray="4 4" visibility="hidden" />
              <Line yAxisId="left" dataKey="dummyS2" name={`Support 2 @ ${support2}`} stroke={chartConfig.support.color} strokeDasharray="2 6" visibility="hidden" />
              <Line yAxisId="left" dataKey="dummyR1" name={`Resistance 1 @ ${resistance1}`} stroke={chartConfig.resistance.color} strokeDasharray="4 4" visibility="hidden" />
              <Line yAxisId="left" dataKey="dummyR2" name={`Resistance 2 @ ${resistance2}`} stroke={chartConfig.resistance.color} strokeDasharray="2 6" visibility="hidden" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

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
  callChngOi: {
    label: 'Call OI Change',
    color: 'hsl(var(--chart-3))', // Blueish
  },
  putChngOi: {
    label: 'Put OI Change',
    color: 'hsl(var(--chart-2))', // Green
  },
  callLtpPctChng: {
    label: 'Call LTP%',
    color: 'hsl(var(--chart-5))', // Pink/Red
  },
  putLtpPctChng: {
    label: 'Put LTP%',
    color: 'hsl(var(--chart-4))', // Yellow/Orange
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


export function OiChangeChart({
  optionChain,
}: {
  optionChain: OptionChain | null;
}) {
  const { chartData, range, resistance1, resistance2, support1, support2 } = useMemo(() => {
    if (!optionChain) return { chartData: [], range: [0, 0], resistance1: 0, resistance2: 0, support1: 0, support2: 0 };

    const { calls, puts } = optionChain;
    const strikes = [...new Set([...calls.map((c) => c.strike), ...puts.map((p) => p.strike)])].sort((a, b) => a - b);
    
    const callMap = new Map(calls.map((c) => [c.strike, c]));
    const putMap = new Map(puts.map((p) => [p.strike, p]));

    const processedData = strikes.map((strike) => {
      const call = callMap.get(strike);
      const put = putMap.get(strike);

      const callPrevLtp = call && call.chng ? call.ltp - call.chng : 0;
      const callLtpPctChng = call && callPrevLtp !== 0 ? (call.chng / callPrevLtp) * 100 : 0;

      const putPrevLtp = put && put.chng ? put.ltp - put.chng : 0;
      const putLtpPctChng = put && putPrevLtp !== 0 ? (put.chng / putPrevLtp) * 100 : 0;
      
      return {
        strike: strike,
        callChngOi: call?.chngInOI ?? 0,
        putChngOi: put?.chngInOI ?? 0,
        callLtpPctChng: parseFloat(callLtpPctChng.toFixed(2)),
        putLtpPctChng: parseFloat(putLtpPctChng.toFixed(2)),
      };
    });

    const callsByOi = [...calls].sort((a, b) => b.oi - a.oi);
    const putsByOi = [...puts].sort((a, b) => b.oi - a.oi);

    const resistance1 = callsByOi[0]?.strike ?? 0;
    const resistance2 = callsByOi[1]?.strike ?? 0;
    const support1 = putsByOi[0]?.strike ?? 0;
    const support2 = putsByOi[1]?.strike ?? 0;

    const rangeText = strikes.length > 0 ? [strikes[0], strikes[strikes.length - 1]] : [0, 0];

    return { chartData: processedData, range: rangeText, resistance1, resistance2, support1, support2 };
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change in OI & LTP% ({range[0]}-{range[1]})</CardTitle>
        <CardDescription>
          Visual analysis of Open Interest and Price changes across strike prices.
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
              <Tooltip 
                content={<ChartTooltipContent 
                    formatter={(value, name) => {
                        const config = chartConfig[name as keyof typeof chartConfig];
                        const label = config ? config.label : name;
                        if (name === 'callChngOi' || name === 'putChngOi') {
                            return [`${(Number(value) / 1e5).toFixed(2)}L`, label]
                        }
                        if (name === 'callLtpPctChng' || name === 'putLtpPctChng') {
                            return [`${Number(value).toFixed(2)}%`, label]
                        }
                        return [value, name]
                    }}
                    labelFormatter={(label) => `Strike: ${label}`}
                />}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="callChngOi"
                name={chartConfig.callChngOi.label}
                fill="var(--color-callChngOi)"
              />
              <Bar
                yAxisId="left"
                dataKey="putChngOi"
                name={chartConfig.putChngOi.label}
                fill="var(--color-putChngOi)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="callLtpPctChng"
                name={chartConfig.callLtpPctChng.label}
                stroke="var(--color-callLtpPctChng)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="putLtpPctChng"
                name={chartConfig.putLtpPctChng.label}
                stroke="var(--color-putLtpPctChng)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />

             <ReferenceLine yAxisId="left" x={support1} stroke={chartConfig.support.color} strokeDasharray="3 3" ifOverflow="visible" label={{ value: `S1`, position: 'insideTopLeft', fill: chartConfig.support.color, fontSize: 12 }} />
             <ReferenceLine yAxisId="left" x={support2} stroke={chartConfig.support.color} strokeDasharray="8 4" ifOverflow="visible" label={{ value: `S2`, position: 'insideTopLeft', dy: 15, fill: chartConfig.support.color, fontSize: 12 }} />
             <ReferenceLine yAxisId="left" x={resistance1} stroke={chartConfig.resistance.color} strokeDasharray="3 3" ifOverflow="visible" label={{ value: `R1`, position: 'insideTopRight', fill: chartConfig.resistance.color, fontSize: 12 }} />
             <ReferenceLine yAxisId="left" x={resistance2} stroke={chartConfig.resistance.color} strokeDasharray="8 4" ifOverflow="visible" label={{ value: `R2`, position: 'insideTopRight', dy: 15, fill: chartConfig.resistance.color, fontSize: 12 }} />
             
             {/* Dummy lines for legend */}
             <Line yAxisId="right" dataKey="dummyS1" name={`Support 1 @ ${support1}`} stroke={chartConfig.support.color} strokeDasharray="3 3" visibility="hidden" />
             <Line yAxisId="right" dataKey="dummyS2" name={`Support 2 @ ${support2}`} stroke={chartConfig.support.color} strokeDasharray="8 4" visibility="hidden" />
             <Line yAxisId="right" dataKey="dummyR1" name={`Resistance 1 @ ${resistance1}`} stroke={chartConfig.resistance.color} strokeDasharray="3 3" visibility="hidden" />
             <Line yAxisId="right" dataKey="dummyR2" name={`Resistance 2 @ ${resistance2}`} stroke={chartConfig.resistance.color} strokeDasharray="8 4" visibility="hidden" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

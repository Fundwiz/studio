'use client';

import { useMemo } from 'react';
import {
  LineChart,
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
import { calculateMaxPain } from '@/lib/utils';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

const chartConfig = {
  payoff: {
    label: 'Total Payoff',
    color: 'hsl(var(--chart-1))',
  },
  maxPain: {
    label: 'Max Pain',
    color: 'hsl(var(--destructive))',
  },
  prevMaxPain: {
    label: 'Prev. Max Pain',
    color: 'hsl(var(--accent))',
  }
} satisfies ChartConfig;

export function MaxPainChart({
  optionChain,
  maxPainHistory,
}: {
  optionChain: OptionChain | null;
  maxPainHistory: { timestamp: number; strike: number; }[];
}) {
  const { chartData, maxPainStrike, strikes } = useMemo(() => {
    return calculateMaxPain(optionChain);
  }, [optionChain]);

  const { change, previousStrike } = useMemo(() => {
      if (maxPainHistory.length < 2) {
          return { change: 0, previousStrike: 0 };
      }
      const currentStrike = maxPainHistory[maxPainHistory.length - 1].strike;
      const oldestStrikeInWindow = maxPainHistory[0].strike;

      if (currentStrike !== oldestStrikeInWindow) {
          return { change: currentStrike - oldestStrikeInWindow, previousStrike: oldestStrikeInWindow };
      }
      return { change: 0, previousStrike: 0 };
  }, [maxPainHistory]);


  if (!optionChain || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Max Pain Visualization</CardTitle>
          <CardDescription>No data available to calculate Max Pain.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Awaiting option chain data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const strikeRange = strikes.length > 0 ? `(${strikes[0]}-${strikes[strikes.length - 1]})` : '';

  const ChangeIndicator = () => {
    if (change > 0) return <ArrowUp className="inline-block h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="inline-block h-4 w-4 text-red-500" />;
    return <Minus className="inline-block h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Max Pain Visualization {strikeRange}</CardTitle>
        <CardDescription className="flex items-center gap-2">
            <span>The Max Pain point is currently at <b className="text-primary">₹{maxPainStrike}</b>.</span>
            {change !== 0 && (
                <span className="flex items-center text-xs text-muted-foreground">
                    <ChangeIndicator />
                    Shifted by {change} points from {previousStrike} in the last hour.
                </span>
            )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="strike" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(val) => val.toLocaleString()}
                label={{ value: 'Strike Price', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="payoff"
                tickFormatter={(val) => `${(val / 1e7).toFixed(0)}Cr`}
                label={{ value: 'Total Option Payoff', angle: -90, position: 'insideLeft', offset: -25 }}
              />
              <Tooltip
                content={<ChartTooltipContent 
                    formatter={(value, name, props) => [`${(Number(props.payload?.payoff) / 1e7).toFixed(2)} Cr`, 'Total Payoff']}
                    labelFormatter={(label) => `Strike: ${label}`}
                />}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend verticalAlign="top" />
              <Line
                type="monotone"
                dataKey="payoff"
                stroke={chartConfig.payoff.color}
                strokeWidth={2}
                dot={{ r: 2, fill: chartConfig.payoff.color }}
                name="Total Payoff"
              />
               <ReferenceLine
                x={maxPainStrike}
                stroke={chartConfig.maxPain.color}
                strokeDasharray="3 3"
                ifOverflow="visible"
              />
              {change !== 0 && previousStrike !== maxPainStrike && (
                 <ReferenceLine
                    x={previousStrike}
                    stroke={chartConfig.prevMaxPain.color}
                    strokeDasharray="8 4"
                    ifOverflow="visible"
                 />
              )}

              {/* Dummy lines for the legend */}
              <Line dataKey="dummyMaxPain" name={`Max Pain @ ${maxPainStrike}`} stroke={chartConfig.maxPain.color} strokeDasharray="3 3" visibility="hidden" />
               {change !== 0 && previousStrike !== maxPainStrike && (
                   <Line dataKey="dummyPrevMaxPain" name={`Prev. Max Pain @ ${previousStrike}`} stroke={chartConfig.prevMaxPain.color} strokeDasharray="8 4" visibility="hidden" />
               )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

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

const chartConfig = {
  payoff: {
    label: 'Total Payoff',
    color: 'hsl(var(--chart-1))',
  },
  maxPain: {
    label: 'Max Pain',
    color: 'hsl(var(--destructive))',
  }
} satisfies ChartConfig;

export function MaxPainChart({
  optionChain,
}: {
  optionChain: OptionChain | null;
}) {
  const { chartData, maxPainStrike, strikes } = useMemo(() => {
    if (!optionChain || !optionChain.calls.length || !optionChain.puts.length) {
      return { chartData: [], maxPainStrike: 0, strikes: [] };
    }

    const { calls, puts } = optionChain;
    const allStrikes = [...new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])].sort((a, b) => a - b);
    
    if (allStrikes.length === 0) {
      return { chartData: [], maxPainStrike: 0, strikes: [] };
    }

    const payoffData = allStrikes.map(expiryStrike => {
      let totalPayoff = 0;

      // Calculate total loss for option writers (which is option buyers' gain)
      calls.forEach(call => {
        if (call.strike < expiryStrike) {
          totalPayoff += (expiryStrike - call.strike) * call.oi;
        }
      });

      puts.forEach(put => {
        if (put.strike > expiryStrike) {
          totalPayoff += (put.strike - expiryStrike) * put.oi;
        }
      });

      return { strike: expiryStrike, payoff: totalPayoff };
    });

    let minPayoff = Infinity;
    let maxPainStrike = 0;
    payoffData.forEach(item => {
      if (item.payoff < minPayoff) {
        minPayoff = item.payoff;
        maxPainStrike = item.strike;
      }
    });

    return { chartData: payoffData, maxPainStrike, strikes: allStrikes };
  }, [optionChain]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Max Pain Visualization {strikeRange}</CardTitle>
        <CardDescription>
          The strike price with the minimum financial loss for option writers. Max pain is at ₹{maxPainStrike}.
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
              {/* Dummy line for the legend */}
              <Line dataKey="dummy" name={`Max Pain @ ${maxPainStrike}`} stroke={chartConfig.maxPain.color} strokeDasharray="3 3" visibility="hidden" />

            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

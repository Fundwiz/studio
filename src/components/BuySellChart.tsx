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
import type { Option, OptionChain } from '@/lib/types';

type BuySellChartProps = {
  optionChain: OptionChain | null;
  type: 'Call' | 'Put';
};

export function BuySellChart({ optionChain, type }: BuySellChartProps) {
  const chartConfig = useMemo(() => ({
    buyQty: {
      label: `${type} Buy Qty`,
      color: 'hsl(var(--chart-2))', // green
    },
    sellQty: {
      label: `${type} Sell Qty`,
      color: 'hsl(var(--chart-1))', // red
    },
  }), [type]) satisfies ChartConfig;

  const { chartData, range } = useMemo(() => {
    if (!optionChain) return { chartData: [], range: [0, 0] };

    const options = type === 'Call' ? optionChain.calls : optionChain.puts;
    const { underlyingPrice } = optionChain;

    const atmStrike = options.reduce((prev, curr) =>
        Math.abs(curr.strike - underlyingPrice) < Math.abs(prev.strike - underlyingPrice) ? curr : prev
    , {strike: 0}).strike;
    
    if (atmStrike === 0) return { chartData: [], range: [0, 0]};

    const atmIndex = options.findIndex(o => o.strike === atmStrike);
    const startIndex = Math.max(0, atmIndex - 7);
    const endIndex = Math.min(options.length, atmIndex + 8);
    const slicedOptions = options.slice(startIndex, endIndex);

    const data = slicedOptions.map(option => ({
        strike: option.strike,
        buyQty: option.bidQty ?? 0,
        sellQty: option.askQty ?? 0,
    }));

    const rangeText = slicedOptions.length > 0 ? [slicedOptions[0].strike, slicedOptions[slicedOptions.length-1].strike] : [0,0];

    return { chartData: data, range: rangeText };
  }, [optionChain, type]);

  if (!optionChain || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nifty {type} Buy vs. Sell Quantity</CardTitle>
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
        <CardTitle>Nifty {type} Buy vs. Sell Quantity ({range[0]}-{range[1]})</CardTitle>
        <CardDescription>
          Comparison of total buy vs. sell order quantity at different strike prices.
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
                angle={-45}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'Quantity',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  style: { textAnchor: 'middle' },
                }}
                tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)}
              />
              <Tooltip
                content={<ChartTooltipContent
                  formatter={(value, name) => [
                    `${(Number(value)).toLocaleString()}`,
                     name === 'buyQty' ? chartConfig.buyQty.label : chartConfig.sellQty.label,
                  ]}
                  labelFormatter={(label) => `Strike: ${label}`}
                />}
              />
              <Legend />
              <Bar
                dataKey="buyQty"
                fill="var(--color-buyQty)"
                name={chartConfig.buyQty.label}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sellQty"
                fill="var(--color-sellQty)"
                name={chartConfig.sellQty.label}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

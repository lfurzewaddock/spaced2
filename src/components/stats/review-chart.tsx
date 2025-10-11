import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ReviewLog } from "ts-fsrs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ReviewChartProps {
  reviewLogs: ReviewLog[];
}

const chartConfig = {
  reviews: {
    label: "Reviews",
  },
  learning: {
    label: "Learning",
    color: "hsl(var(--chart-1))",
  },
  relearning: {
    label: "Relearning",
    color: "hsl(var(--chart-2))",
  },
  review: {
    label: "Review",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function ReviewChart({ reviewLogs }: ReviewChartProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("learning");

  // Process review logs into daily counts for last 3 months
  const chartData = React.useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));

    const dailyCounts = reviewLogs
      .filter((log) => new Date(log.review) >= threeMonthsAgo)
      .reduce(
        (
          acc: Record<
            string,
            {
              date: string;
              learning: number;
              relearning: number;
              review: number;
            }
          >,
          log,
        ) => {
          const date = new Date(log.review).toISOString().split("T")[0];
          if (!acc[date]) {
            acc[date] = {
              date,
              learning: 0,
              relearning: 0,
              review: 0,
            };
          }

          if (log.state === 0) acc[date].learning++;
          else if (log.state === 1) acc[date].relearning++;
          else if (log.state === 2) acc[date].review++;

          return acc;
        },
        {},
      );

    return Object.values(dailyCounts).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [reviewLogs]);

  const total = React.useMemo(
    () => ({
      learning: chartData.reduce((acc, curr) => acc + curr.learning, 0),
      relearning: chartData.reduce((acc, curr) => acc + curr.relearning, 0),
      review: chartData.reduce((acc, curr) => acc + curr.review, 0),
    }),
    [chartData],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Review Activity</CardTitle>
          <CardDescription>
            Showing review activity for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {(["learning", "relearning", "review"] as const).map((chart) => {
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[chart].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="review"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={(chartConfig[activeChart] as { color: string }).color}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

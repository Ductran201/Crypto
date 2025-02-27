"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  UTCTimestamp,
} from "lightweight-charts";
import { ICandleStick, getCandlestickData } from "@/app/ultis/api";
import { useTheme } from "next-themes";

interface ChartProps {
  data: ICandleStick[];
  timeFrame: string;
  setData: (newData: ICandleStick[]) => void;
}

const Chart: React.FC<ChartProps> = ({ data, timeFrame, setData }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [width, setWidth] = useState(0);
  const isFetchingRef = useRef(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const updateSize = () => {
      const newWidth = chartContainerRef.current?.clientWidth || 0;
      setWidth(newWidth);

      if (chartRef.current) {
        chartRef.current.applyOptions({ width: newWidth });
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(chartContainerRef.current);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    if (candlestickSeriesRef.current) {
      chartRef.current?.removeSeries(candlestickSeriesRef.current);
      candlestickSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      chartRef.current?.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    const isDarkMode = theme === "dark";

    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          textColor: isDarkMode ? "white" : "black",
          background: { color: isDarkMode ? "black" : "white" },
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    } else {
      chartRef.current.applyOptions({
        layout: {
          textColor: isDarkMode ? "white" : "black",
          background: { color: isDarkMode ? "black" : "white" },
        },
      });
    }

    const newCandlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    newCandlestickSeries.setData(
      data.map((item) => ({
        time: (item.openTime / 1000) as UTCTimestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
    );

    const newVolumeSeries = chartRef.current.addSeries(HistogramSeries, {
      color: isDarkMode ? "rgba(173, 216, 230, 0.5)" : "rgba(76, 175, 80, 0.5)",
      priceScaleId: "volume",
    });

    newVolumeSeries.setData(
      data.map((item) => ({
        time: (item.openTime / 1000) as UTCTimestamp,
        value: item.volume,
        color:
          item.close > item.open
            ? "rgba(38,166,154,0.5)"
            : "rgba(239,83,80,0.5)",
      }))
    );

    chartRef.current
      .priceScale("right")
      .applyOptions({ scaleMargins: { top: 0.1, bottom: 0.3 } });

    chartRef.current
      .priceScale("volume")
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    candlestickSeriesRef.current = newCandlestickSeries;
    volumeSeriesRef.current = newVolumeSeries;
  }, [theme, data]);

  useEffect(() => {
    if (
      !candlestickSeriesRef.current ||
      !volumeSeriesRef.current ||
      data.length === 0
    )
      return;

    candlestickSeriesRef.current.setData(
      data.map((item) => ({
        time: (item.openTime / 1000) as UTCTimestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
    );

    volumeSeriesRef.current.setData(
      data.map((item) => ({
        time: (item.openTime / 1000) as UTCTimestamp,
        value: item.volume,
        color:
          item.close > item.open
            ? "rgba(38,166,154,0.5)"
            : "rgba(239,83,80,0.5)",
      }))
    );
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const handleVisibleTimeRangeChange = async (range: any) => {
      if (!range || isFetchingRef.current) return;

      const oldestTime = range.from as number;
      const firstDataPoint = data[0].openTime / 1000;

      if (oldestTime <= firstDataPoint) {
        isFetchingRef.current = true;

        const olderData = await getCandlestickData(
          timeFrame,
          "BTCUSDT",
          data[0].openTime
        );

        if (olderData.length > 0) {
          const mergedData = [...olderData, ...data]
            .filter(
              (v, i, self) =>
                i === self.findIndex((d) => d.openTime === v.openTime)
            )
            .sort((a, b) => a.openTime - b.openTime);

          setData(mergedData);
        }

        isFetchingRef.current = false;
      }
    };

    const timeScale = chartRef.current.timeScale();
    timeScale.subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);

    return () =>
      timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);
  }, [data, timeFrame]);

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default Chart;

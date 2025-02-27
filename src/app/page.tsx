"use client";
import { useState, useEffect, useRef } from "react";
import Chart from "@/app/components/Chart";
import { getCandlestickData, ICandleStick } from "@/app/ultis/api";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [candles, setCandles] = useState<ICandleStick[]>([]);
  const [timeFrame, setTimeFrame] = useState("1m");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getCandlestickData(timeFrame, "BTCUSDT");
      setCandles(data);
    };

    fetchData();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchData, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeFrame]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Biểu đồ Bitcoin ({timeFrame})
        <ModeToggle />
      </h1>

      <div className="flex justify-center space-x-2 mb-4">
        {["1m", "5m", "30m", "1h", "4h", "1d"].map((tf) => (
          <Button
            key={tf}
            onClick={() => setTimeFrame(tf)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all  ${
              timeFrame === tf ? "text-muted-foreground bg-muted" : ""
            }`}
          >
            {tf}
          </Button>
        ))}
      </div>

      <div className="border border-gray-300 rounded-lg p-4 shadow-lg bg-background">
        {candles.length > 0 ? (
          <Chart data={candles} timeFrame={timeFrame} setData={setCandles} />
        ) : (
          <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
        )}
      </div>
    </div>
  );
}

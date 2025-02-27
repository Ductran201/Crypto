import axios from "axios";

export type ICandleStick = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

/**
 * Fetch dữ liệu candlestick từ Binance API
 * @param timeFrame Khung thời gian (1m, 5m, 30m, 1h, 4h, 1d)
 * @param symbol Coin muốn lấy dữ liệu (BTCUSDT)
 */

export const getCandlestickData = async (
  timeFrame: string,
  symbol: string,
  endTime?: number // Thêm endTime để lấy dữ liệu cũ
): Promise<ICandleStick[]> => {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeFrame}&limit=50${
      endTime ? `&endTime=${endTime}` : ""
    }`;

    const response = await axios.get<
      [[number, string, string, string, string, string, number]]
    >(url);

    return response.data.map((item) => ({
      openTime: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
      closeTime: item[6],
    }));
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu nến:", error);
    return [];
  }
};

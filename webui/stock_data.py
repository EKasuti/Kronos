"""Fetch real stock K-line data from Yahoo Finance's public chart API and save
it into Kronos's `data/` directory in the same CSV schema used for crypto
(timestamps, open, high, low, close, volume, amount).

Reuses the AutoRefreshManager and DATA_DIR from crypto_data.py so both crypto
and stock symbols can be scheduled independently from the same web UI.
"""
import os

import requests
import pandas as pd

from crypto_data import DATA_DIR

SUPPORTED_STOCKS = {
    'CYPH': 'Cypherpunk Technologies',
    'IREN': 'IREN Limited',
    'GOOGL': 'Alphabet (Google)',
    'AMZN': 'Amazon',
    'META': 'Meta Platforms',
}
DEFAULT_STOCKS = ['CYPH', 'IREN', 'GOOGL', 'AMZN', 'META']

STOCK_INTERVAL = '5m'
STOCK_RANGE = '60d'  # Yahoo's max lookback for 5-minute bars
STOCK_TOTAL_ROWS = 2500  # only regular trading hours, so this covers several weeks


def fetch_yahoo_candles(symbol, interval=STOCK_INTERVAL, range_=STOCK_RANGE, total_rows=STOCK_TOTAL_ROWS):
    """Fetch intraday candles for a stock ticker from Yahoo Finance's public chart API."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"interval": interval, "range": range_}
    resp = requests.get(url, params=params, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
    resp.raise_for_status()
    payload = resp.json()

    chart = payload.get('chart', {})
    if chart.get('error'):
        raise ValueError(f"Yahoo Finance error for {symbol}: {chart['error']}")

    results = chart.get('result')
    if not results:
        raise ValueError(f"No chart data returned for {symbol}")

    result = results[0]
    timestamps = result.get('timestamp')
    quote = result.get('indicators', {}).get('quote', [{}])[0]
    if not timestamps or not quote:
        raise ValueError(f"No candle data returned for {symbol}")

    df = pd.DataFrame({
        'time': timestamps,
        'open': quote.get('open'),
        'high': quote.get('high'),
        'low': quote.get('low'),
        'close': quote.get('close'),
        'volume': quote.get('volume'),
    })
    # Yahoo pads non-trading periods with nulls; drop those bars.
    df = df.dropna(subset=['open', 'high', 'low', 'close'])
    if df.empty:
        raise ValueError(f"No usable candle data returned for {symbol}")

    df['timestamps'] = pd.to_datetime(df['time'], unit='s', utc=True).dt.tz_localize(None)
    df['amount'] = df['close'] * df['volume'].fillna(0)
    df = df[['timestamps', 'open', 'high', 'low', 'close', 'volume', 'amount']]
    df = df.sort_values('timestamps').drop_duplicates(subset='timestamps').reset_index(drop=True)

    if len(df) > total_rows:
        df = df.tail(total_rows).reset_index(drop=True)
    return df


def refresh_stock_symbols(symbols=None, interval=STOCK_INTERVAL, range_=STOCK_RANGE,
                           total_rows=STOCK_TOTAL_ROWS, out_dir=None):
    """Fetch and save the given stock tickers, returning a per-symbol result list."""
    symbols = symbols or DEFAULT_STOCKS
    out_dir = out_dir or DATA_DIR
    os.makedirs(out_dir, exist_ok=True)

    results = []
    for symbol in symbols:
        try:
            df = fetch_yahoo_candles(symbol, interval, range_, total_rows)
            filename = f"{symbol}_5min.csv"
            path = os.path.join(out_dir, filename)
            df.to_csv(path, index=False)
            results.append({
                'symbol': symbol,
                'success': True,
                'file': filename,
                'rows': len(df),
                'start': df['timestamps'].min().isoformat(),
                'end': df['timestamps'].max().isoformat(),
            })
        except Exception as e:
            results.append({'symbol': symbol, 'success': False, 'error': str(e)})
    return results

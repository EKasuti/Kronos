"""Fetch live crypto K-line data from Coinbase's public API and save it into
Kronos's `data/` directory in the CSV schema the web UI expects
(timestamps, open, high, low, close, volume, amount).

Also provides a small background-thread manager so the web UI can schedule
an automatic refresh every N minutes without an external cron job.
"""
import os
import time
import threading
from datetime import datetime, timedelta, timezone

import requests
import pandas as pd

SUPPORTED_SYMBOLS = {
    'BTC-USD': 'Bitcoin',
    'ETH-USD': 'Ethereum',
    'AVAX-USD': 'Avalanche',
    'SOL-USD': 'Solana',
    'DOGE-USD': 'Dogecoin',
    'ZEC-USD': 'Zcash',
    'LINK-USD': 'Chainlink',
}
DEFAULT_SYMBOLS = ['ZEC-USD', 'LINK-USD', 'AVAX-USD', 'BTC-USD']

GRANULARITY_SECONDS = 300  # 5-minute candles
TOTAL_ROWS = 2500  # ~9 days of 5-minute candles
MIN_AUTO_REFRESH_MINUTES = 5  # be polite to the public API

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')

COINBASE_CANDLES_PER_CALL = 300


def fetch_coinbase_candles(product_id, granularity=GRANULARITY_SECONDS, total_rows=TOTAL_ROWS):
    """Fetch candles from Coinbase Exchange's public API, paginating backwards in time."""
    end = datetime.now(timezone.utc)
    all_rows = []

    while len(all_rows) < total_rows:
        start = end - timedelta(seconds=granularity * COINBASE_CANDLES_PER_CALL)
        url = f"https://api.exchange.coinbase.com/products/{product_id}/candles"
        params = {
            "granularity": granularity,
            "start": start.isoformat(),
            "end": end.isoformat(),
        }
        resp = requests.get(url, params=params, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        # each row: [time, low, high, open, close, volume]
        all_rows.extend(data)
        end = start
        time.sleep(0.3)

    if not all_rows:
        raise ValueError(f"No candle data returned for {product_id}")

    df = pd.DataFrame(all_rows, columns=["time", "low", "high", "open", "close", "volume"])
    df = df.drop_duplicates(subset="time").sort_values("time").reset_index(drop=True)
    df["timestamps"] = pd.to_datetime(df["time"], unit="s", utc=True).dt.tz_localize(None)
    df["amount"] = df["close"] * df["volume"]
    df = df[["timestamps", "open", "high", "low", "close", "volume", "amount"]]
    if len(df) > total_rows:
        df = df.tail(total_rows).reset_index(drop=True)
    return df


def refresh_symbols(symbols=None, granularity=GRANULARITY_SECONDS, total_rows=TOTAL_ROWS, out_dir=None):
    """Fetch and save the given symbols, returning a per-symbol result list."""
    symbols = symbols or DEFAULT_SYMBOLS
    out_dir = out_dir or DATA_DIR
    os.makedirs(out_dir, exist_ok=True)

    results = []
    for symbol in symbols:
        try:
            df = fetch_coinbase_candles(symbol, granularity, total_rows)
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


class AutoRefreshManager:
    """Runs `refresh_fn(symbols)` on a background daemon thread every interval_minutes."""

    def __init__(self, refresh_fn):
        self.refresh_fn = refresh_fn
        self._thread = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self._state = {
            'running': False,
            'interval_minutes': None,
            'symbols': [],
            'last_run': None,
            'last_result': None,
            'next_run': None,
        }

    def start(self, symbols, interval_minutes):
        interval_minutes = max(MIN_AUTO_REFRESH_MINUTES, int(interval_minutes))
        self.stop()
        self._stop_event = threading.Event()
        with self._lock:
            self._state.update({
                'running': True,
                'interval_minutes': interval_minutes,
                'symbols': symbols,
                'next_run': datetime.now().isoformat(),
            })
        self._thread = threading.Thread(target=self._loop, args=(symbols, interval_minutes), daemon=True)
        self._thread.start()

    def stop(self):
        if self._thread and self._thread.is_alive():
            self._stop_event.set()
            self._thread.join(timeout=2)
        with self._lock:
            self._state['running'] = False
            self._state['next_run'] = None

    def _loop(self, symbols, interval_minutes):
        while not self._stop_event.is_set():
            try:
                result = self.refresh_fn(symbols)
            except Exception as e:
                result = [{'success': False, 'error': str(e)}]
            with self._lock:
                self._state['last_run'] = datetime.now().isoformat()
                self._state['last_result'] = result
                self._state['next_run'] = (datetime.now() + timedelta(minutes=interval_minutes)).isoformat()

            waited = 0
            total_wait = interval_minutes * 60
            while waited < total_wait and not self._stop_event.is_set():
                step = min(5, total_wait - waited)
                time.sleep(step)
                waited += step

    def get_status(self):
        with self._lock:
            return dict(self._state)

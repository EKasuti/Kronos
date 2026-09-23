"use client";

import { toast } from "sonner";
import { SourcePanel } from "./source-panel";
import {
  useCryptoAutoRefreshStatus,
  useCryptoSymbols,
  useRefreshCrypto,
  useRefreshStocks,
  useSetCryptoAutoRefresh,
  useSetStockAutoRefresh,
  useStockAutoRefreshStatus,
  useStockSymbols,
} from "@/lib/hooks";

export function SourcesTab() {
  const cryptoSymbols = useCryptoSymbols();
  const cryptoAutoRefresh = useCryptoAutoRefreshStatus();
  const refreshCrypto = useRefreshCrypto();
  const setCryptoAutoRefresh = useSetCryptoAutoRefresh();

  const stockSymbols = useStockSymbols();
  const stockAutoRefresh = useStockAutoRefreshStatus();
  const refreshStocks = useRefreshStocks();
  const setStockAutoRefresh = useSetStockAutoRefresh();

  return (
    <div className="space-y-5">
      {cryptoSymbols.data && (
        <SourcePanel
          title="💰 Crypto (Coinbase)"
          symbols={cryptoSymbols.data.symbols}
          defaultSymbols={cryptoSymbols.data.default}
          autoRefreshStatus={cryptoAutoRefresh.data}
          isRefreshing={refreshCrypto.isPending}
          hint="5-minute candles, last ~9 days, saved into data/"
          onRefresh={(symbols) =>
            refreshCrypto.mutate(symbols, {
              onSuccess: (res) => {
                const ok = res.results.filter((r) => r.success).length;
                toast.success(`Crypto data refreshed (${ok}/${res.results.length})`);
              },
              onError: (err) => toast.error(`Crypto refresh failed: ${err.message}`),
            })
          }
          onSetAutoRefresh={(enabled, intervalMinutes, symbols) =>
            setCryptoAutoRefresh.mutate(
              { enabled, intervalMinutes, symbols },
              { onError: (err) => toast.error(err.message) },
            )
          }
        />
      )}

      {stockSymbols.data && (
        <SourcePanel
          title="📈 Stocks (Yahoo Finance)"
          symbols={stockSymbols.data.symbols}
          defaultSymbols={stockSymbols.data.default}
          autoRefreshStatus={stockAutoRefresh.data}
          isRefreshing={refreshStocks.isPending}
          hint="5-minute candles, regular trading hours only, saved into data/"
          onRefresh={(symbols) =>
            refreshStocks.mutate(symbols, {
              onSuccess: (res) => {
                const ok = res.results.filter((r) => r.success).length;
                toast.success(`Stock data refreshed (${ok}/${res.results.length})`);
              },
              onError: (err) => toast.error(`Stock refresh failed: ${err.message}`),
            })
          }
          onSetAutoRefresh={(enabled, intervalMinutes, symbols) =>
            setStockAutoRefresh.mutate(
              { enabled, intervalMinutes, symbols },
              { onError: (err) => toast.error(err.message) },
            )
          }
        />
      )}
    </div>
  );
}

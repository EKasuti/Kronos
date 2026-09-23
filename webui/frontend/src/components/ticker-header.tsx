"use client";

import { ExternalLink } from "lucide-react";
import { useCryptoSymbols, useStockSymbols } from "@/lib/hooks";

// CoinMarketCap URLs need the project's slug, not the ticker, and there's no
// reliable way to derive one from a symbol without an API call - so this maps
// the fixed set of crypto assets this app tracks (see crypto_data.py) to
// their real, verified CoinMarketCap slugs.
const CMC_SLUGS: Record<string, string> = {
  "BTC-USD": "bitcoin",
  "ETH-USD": "ethereum",
  "AVAX-USD": "avalanche",
  "SOL-USD": "solana",
  "DOGE-USD": "dogecoin",
  "ZEC-USD": "zcash",
  "LINK-USD": "chainlink",
};

function symbolFromFile(dataFile: string) {
  return dataFile.split("/").pop()?.replace(/_5min\.csv$/, "") ?? dataFile;
}

export function TickerHeader({ dataFile }: { dataFile: string | null }) {
  const { data: cryptoSymbols } = useCryptoSymbols();
  const { data: stockSymbols } = useStockSymbols();

  if (!dataFile) return null;

  const symbol = symbolFromFile(dataFile);
  const cryptoName = cryptoSymbols?.symbols[symbol];
  const stockName = stockSymbols?.symbols[symbol];

  let externalUrl: string | null = null;
  let externalLabel: string | null = null;

  if (cryptoName) {
    const slug = CMC_SLUGS[symbol];
    if (slug) {
      externalUrl = `https://coinmarketcap.com/currencies/${slug}/`;
      externalLabel = "CoinMarketCap";
    }
  } else if (stockName) {
    externalUrl = `https://finance.yahoo.com/quote/${symbol}/`;
    externalLabel = "Yahoo Finance";
  }

  const displayName = cryptoName ?? stockName;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold">{symbol}</span>
      {displayName && (
        <span className="text-muted-foreground">({displayName})</span>
      )}
      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
        >
          View on {externalLabel}
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

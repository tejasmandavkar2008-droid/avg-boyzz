package Hackathon.Backened;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class YahooFinanceService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    // In-memory cache to prevent Yahoo rate limiting (15 seconds TTL)
    private final Map<String, CachedData> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 15_000;

    private static class CachedData {
        long timestamp;
        Object data;

        CachedData(Object data) {
            this.timestamp = System.currentTimeMillis();
            this.data = data;
        }

        boolean isExpired() {
            return (System.currentTimeMillis() - timestamp) > CACHE_TTL_MS;
        }
    }

    // List of standard marquee Indian stocks
    private static final List<StockConfig> STOCKS_CONFIG = List.of(
            new StockConfig("RELIANCE.NS", "RELIANCE", "Reliance Industries Ltd.", "Energy & Conglomerate"),
            new StockConfig("TCS.NS", "TCS", "Tata Consultancy Services", "IT & Tech"),
            new StockConfig("HDFCBANK.NS", "HDFCBANK", "HDFC Bank Ltd.", "Banking & Finance"),
            new StockConfig("INFY.NS", "INFY", "Infosys Ltd.", "IT & Tech"),
            new StockConfig("ICICIBANK.NS", "ICICIBANK", "ICICI Bank Ltd.", "Banking & Finance"),
            new StockConfig("TATAMOTORS.NS", "TATAMOTORS", "Tata Motors Ltd.", "Automobile"),
            new StockConfig("BHARTIARTL.NS", "BHARTIARTL", "Bharti Airtel Ltd.", "Telecom"),
            new StockConfig("SBIN.NS", "SBIN", "State Bank of India", "Banking & Finance"),
            new StockConfig("ITC.NS", "ITC", "ITC Ltd.", "FMCG"),
            new StockConfig("LT.NS", "LT", "Larsen & Toubro Ltd.", "Infrastructure"),
            new StockConfig("ZOMATO.NS", "ZOMATO", "Zomato Ltd.", "Consumer Tech"),
            new StockConfig("BAJFINANCE.NS", "BAJFINANCE", "Bajaj Finance Ltd.", "Banking & Finance"),
            new StockConfig("SUNPHARMA.NS", "SUNPHARMA", "Sun Pharmaceutical Ind.", "Healthcare & Pharma"),
            new StockConfig("WIPRO.NS", "WIPRO", "Wipro Ltd.", "IT & Tech"),
            new StockConfig("TITAN.NS", "TITAN", "Titan Company Ltd.", "Consumer & Luxury"),
            new StockConfig("MARUTI.NS", "MARUTI", "Maruti Suzuki India", "Automobile"),
            new StockConfig("TATASTEEL.NS", "TATASTEEL", "Tata Steel Ltd.", "Metals & Mining")
    );

    // List of major indices
    private static final List<IndexConfig> INDICES_CONFIG = List.of(
            new IndexConfig("^NSEI", "NIFTY 50", "NSE"),
            new IndexConfig("^BSESN", "BSE SENSEX", "BSE"),
            new IndexConfig("^NSEBANK", "BANK NIFTY", "NSE"),
            new IndexConfig("^CNXIT", "NIFTY IT", "NSE"),
            new IndexConfig("GC=F", "GOLD (Futures)", "COMEX"),
            new IndexConfig("INR=X", "USD / INR", "FOREX")
    );

    public static class StockConfig {
        String ticker;
        String symbol;
        String name;
        String sector;

        StockConfig(String ticker, String symbol, String name, String sector) {
            this.ticker = ticker;
            this.symbol = symbol;
            this.name = name;
            this.sector = sector;
        }
    }

    public static class IndexConfig {
        String ticker;
        String name;
        String exchange;

        IndexConfig(String ticker, String name, String exchange) {
            this.ticker = ticker;
            this.name = name;
            this.exchange = exchange;
        }
    }

    /**
     * Fetch Live Indices from Yahoo Finance
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getLiveIndices() {
        CachedData cached = cache.get("indices");
        if (cached != null && !cached.isExpired()) {
            return (List<Map<String, Object>>) cached.data;
        }

        List<Map<String, Object>> results = new ArrayList<>();

        for (IndexConfig cfg : INDICES_CONFIG) {
            try {
                Map<String, Object> item = fetchSingleIndex(cfg);
                results.add(item);
            } catch (Exception e) {
                results.add(createFallbackIndex(cfg));
            }
        }

        cache.put("indices", new CachedData(results));
        return results;
    }

    private Map<String, Object> fetchSingleIndex(IndexConfig cfg) throws Exception {
        String encodedTicker = java.net.URLEncoder.encode(cfg.ticker, java.nio.charset.StandardCharsets.UTF_8);
        String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodedTicker + "?interval=1d&range=1d";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(Duration.ofSeconds(4))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            String body = response.body();
            double price = extractDouble(body, "\"regularMarketPrice\":", 0.0);
            double prevClose = extractDouble(body, "\"chartPreviousClose\":", price);
            double change = price - prevClose;
            double changePct = prevClose != 0 ? (change / prevClose) * 100.0 : 0.0;

            Map<String, Object> map = new HashMap<>();
            map.put("name", cfg.name);
            map.put("symbol", cfg.ticker);
            map.put("exchange", cfg.exchange);
            map.put("value", round2(price));
            map.put("change", round2(change));
            map.put("changePct", round2(changePct));
            map.put("isPositive", change >= 0);
            map.put("isLive", true);
            return map;
        }

        return createFallbackIndex(cfg);
    }

    private Map<String, Object> createFallbackIndex(IndexConfig cfg) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", cfg.name);
        map.put("symbol", cfg.ticker);
        map.put("exchange", cfg.exchange);
        if (cfg.name.contains("NIFTY 50")) {
            map.put("value", 23897.70);
            map.put("change", 24.30);
            map.put("changePct", 0.10);
        } else if (cfg.name.contains("SENSEX")) {
            map.put("value", 78720.50);
            map.put("change", 115.20);
            map.put("changePct", 0.15);
        } else if (cfg.name.contains("BANK")) {
            map.put("value", 50890.30);
            map.put("change", -78.40);
            map.put("changePct", -0.15);
        } else {
            map.put("value", 72450.00);
            map.put("change", 120.00);
            map.put("changePct", 0.17);
        }
        map.put("isPositive", ((Double) map.get("change")) >= 0);
        map.put("isLive", false);
        return map;
    }

    /**
     * Fetch Live Stocks list with real quotes from Yahoo Finance
     */
    @SuppressWarnings("unchecked")
    public List<MarketStock> getLiveStocks() {
        CachedData cached = cache.get("stocks");
        if (cached != null && !cached.isExpired()) {
            return (List<MarketStock>) cached.data;
        }

        List<MarketStock> stocks = new ArrayList<>();

        for (StockConfig cfg : STOCKS_CONFIG) {
            try {
                MarketStock s = fetchSingleStock(cfg);
                stocks.add(s);
            } catch (Exception e) {
                stocks.add(createFallbackStock(cfg));
            }
        }

        cache.put("stocks", new CachedData(stocks));
        return stocks;
    }

    private MarketStock fetchSingleStock(StockConfig cfg) throws Exception {
        String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + cfg.ticker + "?interval=1d&range=5d";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(Duration.ofSeconds(4))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            String body = response.body();

            double price = round2(extractDouble(body, "\"regularMarketPrice\":", 0.0));
            double prevClose = extractDouble(body, "\"chartPreviousClose\":", price);
            double change = round2(price - prevClose);
            double changePct = prevClose != 0 ? round2((change / prevClose) * 100.0) : 0.0;
            double dayHigh = round2(extractDouble(body, "\"regularMarketDayHigh\":", price));
            double dayLow = round2(extractDouble(body, "\"regularMarketDayLow\":", price));
            double week52High = round2(extractDouble(body, "\"fiftyTwoWeekHigh\":", dayHigh));
            double week52Low = round2(extractDouble(body, "\"fiftyTwoWeekLow\":", dayLow));
            long rawVolume = extractLong(body, "\"regularMarketVolume\":", 0);
            String volumeStr = formatVolume(rawVolume);

            // Extract sparkline prices
            List<Double> sparkline = extractSparkline(body);
            if (sparkline.isEmpty()) {
                sparkline = List.of(price * 0.98, price * 0.99, price * 1.01, price * 0.995, price);
            }

            return new MarketStock(
                    cfg.symbol,
                    cfg.name,
                    cfg.sector,
                    price,
                    change,
                    changePct,
                    dayHigh,
                    dayLow,
                    volumeStr,
                    "Live NSE",
                    28.5,
                    week52High,
                    week52Low,
                    sparkline
            );
        }

        return createFallbackStock(cfg);
    }

    private List<Double> extractSparkline(String json) {
        List<Double> list = new ArrayList<>();
        int closeIdx = json.indexOf("\"close\":[");
        if (closeIdx != -1) {
            int start = closeIdx + 9;
            int end = json.indexOf("]", start);
            if (end != -1) {
                String sub = json.substring(start, end);
                String[] parts = sub.split(",");
                for (String p : parts) {
                    try {
                        String clean = p.trim();
                        if (!clean.equals("null") && !clean.isEmpty()) {
                            list.add(round2(Double.parseDouble(clean)));
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return list;
    }

    private double extractDouble(String json, String prefix, double defaultVal) {
        int idx = json.indexOf(prefix);
        if (idx == -1) return defaultVal;
        int start = idx + prefix.length();
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) {
            end++;
        }
        try {
            return Double.parseDouble(json.substring(start, end));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private long extractLong(String json, String prefix, long defaultVal) {
        int idx = json.indexOf(prefix);
        if (idx == -1) return defaultVal;
        int start = idx + prefix.length();
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
            end++;
        }
        try {
            return Long.parseLong(json.substring(start, end));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private MarketStock createFallbackStock(StockConfig cfg) {
        double fallbackPrice = switch (cfg.symbol) {
            case "RELIANCE" -> 1322.00;
            case "TCS" -> 2304.00;
            case "HDFCBANK" -> 1645.75;
            case "INFY" -> 1922.30;
            case "ICICIBANK" -> 1218.40;
            case "TATAMOTORS" -> 1085.60;
            case "BHARTIARTL" -> 1568.20;
            case "SBIN" -> 814.50;
            case "ITC" -> 508.40;
            case "LT" -> 3680.00;
            case "ZOMATO" -> 256.80;
            case "BAJFINANCE" -> 7320.00;
            case "SUNPHARMA" -> 1812.00;
            case "WIPRO" -> 528.30;
            case "TITAN" -> 3725.00;
            default -> 1000.00;
        };

        return new MarketStock(
                cfg.symbol,
                cfg.name,
                cfg.sector,
                fallbackPrice,
                15.20,
                1.15,
                fallbackPrice * 1.02,
                fallbackPrice * 0.98,
                "5.2M",
                "NSE",
                25.0,
                fallbackPrice * 1.2,
                fallbackPrice * 0.8,
                List.of(fallbackPrice * 0.98, fallbackPrice * 0.99, fallbackPrice * 1.005, fallbackPrice)
        );
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private String formatVolume(long vol) {
        if (vol >= 10_000_000) {
            return String.format(Locale.US, "%.1fM", vol / 1_000_000.0);
        } else if (vol >= 100_000) {
            return String.format(Locale.US, "%.1fL", vol / 100_000.0);
        } else if (vol >= 1_000) {
            return String.format(Locale.US, "%.1fK", vol / 1_000.0);
        }
        return String.valueOf(vol);
    }
}

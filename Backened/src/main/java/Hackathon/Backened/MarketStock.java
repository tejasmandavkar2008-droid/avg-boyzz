package Hackathon.Backened;

import java.util.List;

public class MarketStock {
    private String symbol;
    private String name;
    private String sector;
    private double price;
    private double change;
    private double changePct;
    private double dayHigh;
    private double dayLow;
    private String volume;
    private String marketCap;
    private double peRatio;
    private double week52High;
    private double week52Low;
    private List<Double> sparkline;

    public MarketStock() {}

    public MarketStock(String symbol, String name, String sector, double price, double change,
                       double changePct, double dayHigh, double dayLow, String volume,
                       String marketCap, double peRatio, double week52High, double week52Low,
                       List<Double> sparkline) {
        this.symbol = symbol;
        this.name = name;
        this.sector = sector;
        this.price = price;
        this.change = change;
        this.changePct = changePct;
        this.dayHigh = dayHigh;
        this.dayLow = dayLow;
        this.volume = volume;
        this.marketCap = marketCap;
        this.peRatio = peRatio;
        this.week52High = week52High;
        this.week52Low = week52Low;
        this.sparkline = sparkline;
    }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getChange() { return change; }
    public void setChange(double change) { this.change = change; }

    public double getChangePct() { return changePct; }
    public void setChangePct(double changePct) { this.changePct = changePct; }

    public double getDayHigh() { return dayHigh; }
    public void setDayHigh(double dayHigh) { this.dayHigh = dayHigh; }

    public double getDayLow() { return dayLow; }
    public void setDayLow(double dayLow) { this.dayLow = dayLow; }

    public String getVolume() { return volume; }
    public void setVolume(String volume) { this.volume = volume; }

    public String getMarketCap() { return marketCap; }
    public void setMarketCap(String marketCap) { this.marketCap = marketCap; }

    public double getPeRatio() { return peRatio; }
    public void setPeRatio(double peRatio) { this.peRatio = peRatio; }

    public double getWeek52High() { return week52High; }
    public void setWeek52High(double week52High) { this.week52High = week52High; }

    public double getWeek52Low() { return week52Low; }
    public void setWeek52Low(double week52Low) { this.week52Low = week52Low; }

    public List<Double> getSparkline() { return sparkline; }
    public void setSparkline(List<Double> sparkline) { this.sparkline = sparkline; }
}

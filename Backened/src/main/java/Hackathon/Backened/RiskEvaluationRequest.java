package Hackathon.Backened;

import java.util.List;
import java.util.Map;

public class RiskEvaluationRequest {
    private String userEmail;
    private Double capital;
    private Double equityPct;
    private Double bondsPct;
    private Double goldPct;
    private Double cashPct;
    private Double requiredLiquidityPct;
    private Double maxStockConcentrationLimitPct;
    private Double confidenceLevel; // 95 or 99
    private List<Map<String, Object>> customHoldings; // symbol, name, weightPct, assetClass

    public RiskEvaluationRequest() {}

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Double getCapital() { return capital; }
    public void setCapital(Double capital) { this.capital = capital; }

    public Double getEquityPct() { return equityPct; }
    public void setEquityPct(Double equityPct) { this.equityPct = equityPct; }

    public Double getBondsPct() { return bondsPct; }
    public void setBondsPct(Double bondsPct) { this.bondsPct = bondsPct; }

    public Double getGoldPct() { return goldPct; }
    public void setGoldPct(Double goldPct) { this.goldPct = goldPct; }

    public Double getCashPct() { return cashPct; }
    public void setCashPct(Double cashPct) { this.cashPct = cashPct; }

    public Double getRequiredLiquidityPct() { return requiredLiquidityPct; }
    public void setRequiredLiquidityPct(Double requiredLiquidityPct) { this.requiredLiquidityPct = requiredLiquidityPct; }

    public Double getMaxStockConcentrationLimitPct() { return maxStockConcentrationLimitPct; }
    public void setMaxStockConcentrationLimitPct(Double maxStockConcentrationLimitPct) { this.maxStockConcentrationLimitPct = maxStockConcentrationLimitPct; }

    public Double getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(Double confidenceLevel) { this.confidenceLevel = confidenceLevel; }

    private Double maxStockLimitPct;       // Default <= 40%
    private Double maxBondsLimitPct;       // Default <= 50%
    private Double maxGoldLimitPct;        // Default <= 25%
    private Double minCashLimitPct;        // Default >= 15%
    private Double maxVaRLimitPct;         // Default VaR <= 6.0%
    private Double maxVolatilityLimitPct;  // Default Volatility <= 14.0%

    public List<Map<String, Object>> getCustomHoldings() { return customHoldings; }
    public void setCustomHoldings(List<Map<String, Object>> customHoldings) { this.customHoldings = customHoldings; }

    public Double getMaxStockLimitPct() { return maxStockLimitPct; }
    public void setMaxStockLimitPct(Double maxStockLimitPct) { this.maxStockLimitPct = maxStockLimitPct; }

    public Double getMaxBondsLimitPct() { return maxBondsLimitPct; }
    public void setMaxBondsLimitPct(Double maxBondsLimitPct) { this.maxBondsLimitPct = maxBondsLimitPct; }

    public Double getMaxGoldLimitPct() { return maxGoldLimitPct; }
    public void setMaxGoldLimitPct(Double maxGoldLimitPct) { this.maxGoldLimitPct = maxGoldLimitPct; }

    public Double getMinCashLimitPct() { return minCashLimitPct; }
    public void setMinCashLimitPct(Double minCashLimitPct) { this.minCashLimitPct = minCashLimitPct; }

    public Double getMaxVaRLimitPct() { return maxVaRLimitPct; }
    public void setMaxVaRLimitPct(Double maxVaRLimitPct) { this.maxVaRLimitPct = maxVaRLimitPct; }

    public Double getMaxVolatilityLimitPct() { return maxVolatilityLimitPct; }
    public void setMaxVolatilityLimitPct(Double maxVolatilityLimitPct) { this.maxVolatilityLimitPct = maxVolatilityLimitPct; }
}

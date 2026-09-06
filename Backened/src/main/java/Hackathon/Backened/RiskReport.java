package Hackathon.Backened;

import java.util.List;
import java.util.Map;

public class RiskReport {
    private Double capital;
    private Double overallRiskScore;    // 0 to 100
    private String riskStatus;           // "OPTIMAL", "ELEVATED_RISK", "CRITICAL_BREACH"
    private String riskClassification;   // "Conservative", "Moderate", "Aggressive", "Critical Risk"

    // Section A: Portfolio Volatility
    private Map<String, Object> volatilityMetrics;

    // Section B: Value at Risk (VaR)
    private Map<String, Object> valueAtRiskMetrics;

    // Section C: Maximum Drawdown (MDD)
    private Map<String, Object> drawdownMetrics;

    // Section D: Liquidity Ratio & Control
    private Map<String, Object> liquidityMetrics;

    // Section E: Concentration Risk
    private Map<String, Object> concentrationMetrics;

    // Breaches and Alerts
    private List<RiskBreach> activeBreaches;
    private List<String> recommendations;
    private List<Map<String, Object>> stressTestScenarios;

    // Section F: Rebalance Friction & Transaction Cost Optimization
    private Map<String, Object> rebalanceOptimization;

    // Section G: Markowitz Modern Portfolio Theory (MPT) Efficient Frontier
    private Map<String, Object> efficientFrontier;

    // Section H: Real-World Constrained Portfolio Optimizer
    private Map<String, Object> constrainedOptimizer;

    public RiskReport() {}

    public Double getCapital() { return capital; }
    public void setCapital(Double capital) { this.capital = capital; }

    public Double getOverallRiskScore() { return overallRiskScore; }
    public void setOverallRiskScore(Double overallRiskScore) { this.overallRiskScore = overallRiskScore; }

    public String getRiskStatus() { return riskStatus; }
    public void setRiskStatus(String riskStatus) { this.riskStatus = riskStatus; }

    public String getRiskClassification() { return riskClassification; }
    public void setRiskClassification(String riskClassification) { this.riskClassification = riskClassification; }

    public Map<String, Object> getVolatilityMetrics() { return volatilityMetrics; }
    public void setVolatilityMetrics(Map<String, Object> volatilityMetrics) { this.volatilityMetrics = volatilityMetrics; }

    public Map<String, Object> getValueAtRiskMetrics() { return valueAtRiskMetrics; }
    public void setValueAtRiskMetrics(Map<String, Object> valueAtRiskMetrics) { this.valueAtRiskMetrics = valueAtRiskMetrics; }

    public Map<String, Object> getDrawdownMetrics() { return drawdownMetrics; }
    public void setDrawdownMetrics(Map<String, Object> drawdownMetrics) { this.drawdownMetrics = drawdownMetrics; }

    public Map<String, Object> getLiquidityMetrics() { return liquidityMetrics; }
    public void setLiquidityMetrics(Map<String, Object> liquidityMetrics) { this.liquidityMetrics = liquidityMetrics; }

    public Map<String, Object> getConcentrationMetrics() { return concentrationMetrics; }
    public void setConcentrationMetrics(Map<String, Object> concentrationMetrics) { this.concentrationMetrics = concentrationMetrics; }

    public List<RiskBreach> getActiveBreaches() { return activeBreaches; }
    public void setActiveBreaches(List<RiskBreach> activeBreaches) { this.activeBreaches = activeBreaches; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public List<Map<String, Object>> getStressTestScenarios() { return stressTestScenarios; }
    public void setStressTestScenarios(List<Map<String, Object>> stressTestScenarios) { this.stressTestScenarios = stressTestScenarios; }

    public Map<String, Object> getRebalanceOptimization() { return rebalanceOptimization; }
    public void setRebalanceOptimization(Map<String, Object> rebalanceOptimization) { this.rebalanceOptimization = rebalanceOptimization; }

    public Map<String, Object> getEfficientFrontier() { return efficientFrontier; }
    public void setEfficientFrontier(Map<String, Object> efficientFrontier) { this.efficientFrontier = efficientFrontier; }

    public Map<String, Object> getConstrainedOptimizer() { return constrainedOptimizer; }
    public void setConstrainedOptimizer(Map<String, Object> constrainedOptimizer) { this.constrainedOptimizer = constrainedOptimizer; }
}

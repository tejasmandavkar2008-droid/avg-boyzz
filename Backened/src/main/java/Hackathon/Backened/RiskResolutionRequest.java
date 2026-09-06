package Hackathon.Backened;

public class RiskResolutionRequest {
    private String userEmail;
    private Double capital;
    private String triggerAction;
    private Integer previousBreachCount;
    private String resolvedBreachTypes;
    private Double previousVaR;
    private Double resolvedVaR;
    private Double previousStockPct;
    private Double resolvedStockPct;
    private Double resolvedBondsPct;
    private Double resolvedGoldPct;
    private Double resolvedCashPct;
    private Double resolvedLiquidityRatio;
    private String status;
    private String resolutionSummary;

    public RiskResolutionRequest() {}

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Double getCapital() { return capital; }
    public void setCapital(Double capital) { this.capital = capital; }

    public String getTriggerAction() { return triggerAction; }
    public void setTriggerAction(String triggerAction) { this.triggerAction = triggerAction; }

    public Integer getPreviousBreachCount() { return previousBreachCount; }
    public void setPreviousBreachCount(Integer previousBreachCount) { this.previousBreachCount = previousBreachCount; }

    public String getResolvedBreachTypes() { return resolvedBreachTypes; }
    public void setResolvedBreachTypes(String resolvedBreachTypes) { this.resolvedBreachTypes = resolvedBreachTypes; }

    public Double getPreviousVaR() { return previousVaR; }
    public void setPreviousVaR(Double previousVaR) { this.previousVaR = previousVaR; }

    public Double getResolvedVaR() { return resolvedVaR; }
    public void setResolvedVaR(Double resolvedVaR) { this.resolvedVaR = resolvedVaR; }

    public Double getPreviousStockPct() { return previousStockPct; }
    public void setPreviousStockPct(Double previousStockPct) { this.previousStockPct = previousStockPct; }

    public Double getResolvedStockPct() { return resolvedStockPct; }
    public void setResolvedStockPct(Double resolvedStockPct) { this.resolvedStockPct = resolvedStockPct; }

    public Double getResolvedBondsPct() { return resolvedBondsPct; }
    public void setResolvedBondsPct(Double resolvedBondsPct) { this.resolvedBondsPct = resolvedBondsPct; }

    public Double getResolvedGoldPct() { return resolvedGoldPct; }
    public void setResolvedGoldPct(Double resolvedGoldPct) { this.resolvedGoldPct = resolvedGoldPct; }

    public Double getResolvedCashPct() { return resolvedCashPct; }
    public void setResolvedCashPct(Double resolvedCashPct) { this.resolvedCashPct = resolvedCashPct; }

    public Double getResolvedLiquidityRatio() { return resolvedLiquidityRatio; }
    public void setResolvedLiquidityRatio(Double resolvedLiquidityRatio) { this.resolvedLiquidityRatio = resolvedLiquidityRatio; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionSummary() { return resolutionSummary; }
    public void setResolutionSummary(String resolutionSummary) { this.resolutionSummary = resolutionSummary; }
}

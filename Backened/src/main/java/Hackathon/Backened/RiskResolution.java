package Hackathon.Backened;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_resolutions")
public class RiskResolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private Double capital;

    private String triggerAction; // e.g. "APPLY_CONSTRAINED_REBALANCE", "AUTO_CURE_BREACHES"

    private Integer previousBreachCount;

    @Column(length = 1000)
    private String resolvedBreachTypes; // e.g. "CONCENTRATION_BREACH, LIQUIDITY_DEFICIT"

    private Double previousVaR; // e.g. 8.2

    private Double resolvedVaR; // e.g. 5.1

    private Double previousStockPct; // e.g. 60.0

    private Double resolvedStockPct; // e.g. 35.0

    private Double resolvedBondsPct; // e.g. 35.0

    private Double resolvedGoldPct; // e.g. 15.0

    private Double resolvedCashPct; // e.g. 15.0

    private Double resolvedLiquidityRatio; // e.g. 15.0 or 21.0

    private String status; // "CURED", "COMPLIANT", "OPTIMAL"

    @Column(length = 2000)
    private String resolutionSummary;

    private LocalDateTime createdAt;

    public RiskResolution() {
        this.createdAt = LocalDateTime.now();
    }

    public RiskResolution(String userEmail, Double capital, String triggerAction,
                          Integer previousBreachCount, String resolvedBreachTypes,
                          Double previousVaR, Double resolvedVaR,
                          Double previousStockPct, Double resolvedStockPct,
                          Double resolvedBondsPct, Double resolvedGoldPct,
                          Double resolvedCashPct, Double resolvedLiquidityRatio,
                          String status, String resolutionSummary) {
        this.userEmail = userEmail;
        this.capital = capital;
        this.triggerAction = triggerAction;
        this.previousBreachCount = previousBreachCount;
        this.resolvedBreachTypes = resolvedBreachTypes;
        this.previousVaR = previousVaR;
        this.resolvedVaR = resolvedVaR;
        this.previousStockPct = previousStockPct;
        this.resolvedStockPct = resolvedStockPct;
        this.resolvedBondsPct = resolvedBondsPct;
        this.resolvedGoldPct = resolvedGoldPct;
        this.resolvedCashPct = resolvedCashPct;
        this.resolvedLiquidityRatio = resolvedLiquidityRatio;
        this.status = status;
        this.resolutionSummary = resolutionSummary;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

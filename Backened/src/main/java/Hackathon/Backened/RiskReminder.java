package Hackathon.Backened;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_reminders")
public class RiskReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    private Double portfolioCapital;

    private Double configuredRiskLimit; // e.g. 12.4%

    private Double currentMarketRisk; // e.g. 16.8%

    private Double marketDropPct; // e.g. -5.5%

    private String alertType; // "MARKET_STEP_DOWN", "VAR_BREACH", "DRAWDOWN_EXCEEDED"

    private String severity; // "CRITICAL", "WARNING", "INFO"

    @Column(length = 1500)
    private String message;

    private Boolean isRead = false;

    private LocalDateTime createdAt;

    public RiskReminder() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public RiskReminder(String userEmail, Double portfolioCapital, Double configuredRiskLimit,
                        Double currentMarketRisk, Double marketDropPct, String alertType,
                        String severity, String message) {
        this.userEmail = userEmail;
        this.portfolioCapital = portfolioCapital;
        this.configuredRiskLimit = configuredRiskLimit;
        this.currentMarketRisk = currentMarketRisk;
        this.marketDropPct = marketDropPct;
        this.alertType = alertType;
        this.severity = severity;
        this.message = message;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Double getPortfolioCapital() { return portfolioCapital; }
    public void setPortfolioCapital(Double portfolioCapital) { this.portfolioCapital = portfolioCapital; }

    public Double getConfiguredRiskLimit() { return configuredRiskLimit; }
    public void setConfiguredRiskLimit(Double configuredRiskLimit) { this.configuredRiskLimit = configuredRiskLimit; }

    public Double getCurrentMarketRisk() { return currentMarketRisk; }
    public void setCurrentMarketRisk(Double currentMarketRisk) { this.currentMarketRisk = currentMarketRisk; }

    public Double getMarketDropPct() { return marketDropPct; }
    public void setMarketDropPct(Double marketDropPct) { this.marketDropPct = marketDropPct; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

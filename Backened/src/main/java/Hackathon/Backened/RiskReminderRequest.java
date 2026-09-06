package Hackathon.Backened;

public class RiskReminderRequest {
    private String userEmail;
    private Double portfolioCapital;
    private Double configuredRiskLimit;
    private Double currentMarketRisk;
    private Double marketDropPct;
    private String alertType;
    private String severity;
    private String message;

    public RiskReminderRequest() {}

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
}

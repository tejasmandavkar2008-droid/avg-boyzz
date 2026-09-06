package Hackathon.Backened;

public class RiskBreach {
    private String type;         // "LIQUIDITY", "CONCENTRATION", "VOLATILITY", "VAR_LIMIT", "DRAWDOWN"
    private String severity;     // "CRITICAL", "WARNING", "INFO"
    private String title;
    private String message;
    private Double currentValue;
    private Double thresholdValue;
    private Double impactRupees;
    private String recommendation;

    public RiskBreach() {}

    public RiskBreach(String type, String severity, String title, String message, 
                      Double currentValue, Double thresholdValue, Double impactRupees, String recommendation) {
        this.type = type;
        this.severity = severity;
        this.title = title;
        this.message = message;
        this.currentValue = currentValue;
        this.thresholdValue = thresholdValue;
        this.impactRupees = impactRupees;
        this.recommendation = recommendation;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }

    public Double getThresholdValue() { return thresholdValue; }
    public void setThresholdValue(Double thresholdValue) { this.thresholdValue = thresholdValue; }

    public Double getImpactRupees() { return impactRupees; }
    public void setImpactRupees(Double impactRupees) { this.impactRupees = impactRupees; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}

package Hackathon.Backened;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolios")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String userEmail;

    @Column(nullable = false)
    private Double capital;

    @Column(nullable = false)
    private Double riskLimit;

    @Column(nullable = false)
    private Double liquidityLimit;

    @Column(nullable = false)
    private Double expectedReturn;

    private LocalDateTime updatedAt;

    public Portfolio() {}

    public Portfolio(String userEmail, Double capital, Double riskLimit, Double liquidityLimit, Double expectedReturn) {
        this.userEmail = userEmail;
        this.capital = capital;
        this.riskLimit = riskLimit;
        this.liquidityLimit = liquidityLimit;
        this.expectedReturn = expectedReturn;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Double getCapital() { return capital; }
    public void setCapital(Double capital) { this.capital = capital; }

    public Double getRiskLimit() { return riskLimit; }
    public void setRiskLimit(Double riskLimit) { this.riskLimit = riskLimit; }

    public Double getLiquidityLimit() { return liquidityLimit; }
    public void setLiquidityLimit(Double liquidityLimit) { this.liquidityLimit = liquidityLimit; }

    public Double getExpectedReturn() { return expectedReturn; }
    public void setExpectedReturn(Double expectedReturn) { this.expectedReturn = expectedReturn; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

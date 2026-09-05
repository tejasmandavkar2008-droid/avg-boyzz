package Hackathon.Backened.model;

import jakarta.persistence.*;

@Entity
@Table(name = "assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String symbol;

    private String type;

    @Column(name = "current_price")
    private Double currentPrice;

    @Column(name = "expected_return")
    private Double expectedReturn;

    private String risk;

    @Column(name = "liquidity_score")
    private Double liquidityScore;

    public Asset() {
    }

    public Asset(Long id, String name, String symbol, String type, Double currentPrice, Double expectedReturn, String risk, Double liquidityScore) {
        this.id = id;
        this.name = name;
        this.symbol = symbol;
        this.type = type;
        this.currentPrice = currentPrice;
        this.expectedReturn = expectedReturn;
        this.risk = risk;
        this.liquidityScore = liquidityScore;
    }

    public Asset(String name, String symbol, String type, Double currentPrice, Double expectedReturn, String risk, Double liquidityScore) {
        this.name = name;
        this.symbol = symbol;
        this.type = type;
        this.currentPrice = currentPrice;
        this.expectedReturn = expectedReturn;
        this.risk = risk;
        this.liquidityScore = liquidityScore;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Double currentPrice) {
        this.currentPrice = currentPrice;
    }

    public Double getExpectedReturn() {
        return expectedReturn;
    }

    public void setExpectedReturn(Double expectedReturn) {
        this.expectedReturn = expectedReturn;
    }

    public String getRisk() {
        return risk;
    }

    public void setRisk(String risk) {
        this.risk = risk;
    }

    public Double getLiquidityScore() {
        return liquidityScore;
    }

    public void setLiquidityScore(Double liquidityScore) {
        this.liquidityScore = liquidityScore;
    }
}

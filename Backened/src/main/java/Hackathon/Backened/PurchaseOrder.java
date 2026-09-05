package Hackathon.Backened;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private String stockName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Double totalCost;

    @Column(nullable = false)
    private String orderType = "BUY"; // BUY or SELL

    @Column(nullable = false)
    private String status = "EXECUTED";

    private LocalDateTime orderTime;

    public PurchaseOrder() {}

    public PurchaseOrder(String userEmail, String symbol, String stockName, Integer quantity, Double price, Double totalCost, String orderType) {
        this.userEmail = userEmail;
        this.symbol = symbol;
        this.stockName = stockName;
        this.quantity = quantity;
        this.price = price;
        this.totalCost = totalCost;
        this.orderType = orderType;
        this.status = "EXECUTED";
        this.orderTime = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getStockName() { return stockName; }
    public void setStockName(String stockName) { this.stockName = stockName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getOrderTime() { return orderTime; }
    public void setOrderTime(LocalDateTime orderTime) { this.orderTime = orderTime; }
}

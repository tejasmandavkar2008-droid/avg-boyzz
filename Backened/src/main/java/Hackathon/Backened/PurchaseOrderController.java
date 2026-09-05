package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserOrdersAndHoldings(@RequestParam(required = false) String email) {
        String userEmail = (email != null && !email.isBlank()) ? email : "guest";

        List<PurchaseOrder> orders = purchaseOrderRepository.findByUserEmailOrderByOrderTimeDesc(userEmail);

        // Aggregate holdings from orders in chronological order
        Map<String, Map<String, Object>> holdingsMap = new LinkedHashMap<>();
        List<PurchaseOrder> chronologicalOrders = new ArrayList<>(orders);
        Collections.reverse(chronologicalOrders);

        double totalCashSpentOnBuys = 0.0;
        double totalCashReceivedFromSells = 0.0;

        for (PurchaseOrder order : chronologicalOrders) {
            String sym = order.getSymbol();
            holdingsMap.putIfAbsent(sym, new HashMap<>());
            Map<String, Object> h = holdingsMap.get(sym);

            int currentQty = (int) h.getOrDefault("quantity", 0);
            double currentInvested = (double) h.getOrDefault("totalInvested", 0.0);

            h.put("symbol", sym);
            h.put("stockName", order.getStockName());

            if ("BUY".equalsIgnoreCase(order.getOrderType())) {
                currentQty += order.getQuantity();
                currentInvested += order.getTotalCost();
                totalCashSpentOnBuys += order.getTotalCost();
            } else if ("SELL".equalsIgnoreCase(order.getOrderType())) {
                double avgBuy = currentQty > 0 ? (currentInvested / currentQty) : order.getPrice();
                currentQty = Math.max(0, currentQty - order.getQuantity());
                currentInvested = Math.max(0.0, currentInvested - (order.getQuantity() * avgBuy));
                totalCashReceivedFromSells += order.getTotalCost();
            }

            h.put("quantity", currentQty);
            h.put("totalInvested", Math.max(0.0, Math.round(currentInvested * 100.0) / 100.0));
            double avgPrice = currentQty > 0 ? (currentInvested / currentQty) : 0.0;
            h.put("avgBuyPrice", Math.round(avgPrice * 100.0) / 100.0);
        }

        // Filter out zero-quantity holdings
        List<Map<String, Object>> activeHoldings = new ArrayList<>();
        double totalInvestedInStocks = 0.0;

        for (Map<String, Object> h : holdingsMap.values()) {
            int qty = (int) h.get("quantity");
            if (qty > 0) {
                activeHoldings.add(h);
                totalInvestedInStocks += (double) h.get("totalInvested");
            }
        }

        // Get user capital
        double userCapital = 500000.0; // Default
        Optional<Portfolio> pOpt = portfolioRepository.findByUserEmail(userEmail);
        if (pOpt.isPresent()) {
            userCapital = pOpt.get().getCapital();
        }

        double availableCash = Math.max(0.0, userCapital - totalCashSpentOnBuys + totalCashReceivedFromSells);

        Map<String, Object> response = new HashMap<>();
        response.put("orders", orders);
        response.put("holdings", activeHoldings);
        response.put("totalInvestedInStocks", Math.round(totalInvestedInStocks * 100.0) / 100.0);
        response.put("totalCapital", userCapital);
        response.put("availableCash", Math.round(availableCash * 100.0) / 100.0);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buyStock(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String userEmail = (email != null && !email.isBlank()) ? email : "guest";

        String symbol = (String) body.get("symbol");
        String stockName = (String) body.get("stockName");

        int quantity;
        double price;

        try {
            quantity = Integer.parseInt(body.get("quantity").toString());
            price = Double.parseDouble(body.get("price").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid quantity or price."));
        }

        if (symbol == null || symbol.isBlank() || quantity <= 0 || price <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Symbol, valid quantity, and price are required."));
        }

        double totalCost = Math.round((quantity * price) * 100.0) / 100.0;

        PurchaseOrder order = new PurchaseOrder(
                userEmail,
                symbol.toUpperCase(),
                stockName != null ? stockName : symbol,
                quantity,
                price,
                totalCost,
                "BUY"
        );

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        return ResponseEntity.ok(Map.of(
                "message", String.format("Successfully purchased %d shares of %s at ₹%.2f!", quantity, symbol, price),
                "order", saved
        ));
    }

    @PostMapping("/sell")
    public ResponseEntity<?> sellStock(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String userEmail = (email != null && !email.isBlank()) ? email : "guest";

        String symbol = (String) body.get("symbol");
        String stockName = (String) body.get("stockName");

        int quantity;
        double price;

        try {
            quantity = Integer.parseInt(body.get("quantity").toString());
            price = Double.parseDouble(body.get("price").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid quantity or price."));
        }

        if (symbol == null || symbol.isBlank() || quantity <= 0 || price <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Symbol, valid quantity, and price are required."));
        }

        double totalReturn = Math.round((quantity * price) * 100.0) / 100.0;

        PurchaseOrder order = new PurchaseOrder(
                userEmail,
                symbol.toUpperCase(),
                stockName != null ? stockName : symbol,
                quantity,
                price,
                totalReturn,
                "SELL"
        );

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        return ResponseEntity.ok(Map.of(
                "message", String.format("Successfully sold %d shares of %s at ₹%.2f!", quantity, symbol, price),
                "order", saved
        ));
    }
}

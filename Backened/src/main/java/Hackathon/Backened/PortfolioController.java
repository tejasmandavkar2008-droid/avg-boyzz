package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @GetMapping
    public ResponseEntity<Portfolio> getPortfolio(@RequestParam(required = false) String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.ok(new Portfolio("guest", 10000000.0, 12.4, 72.0, 11.8));
        }

        Optional<Portfolio> portfolioOpt = portfolioRepository.findByUserEmail(email);
        return portfolioOpt
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new Portfolio(email, 10000000.0, 12.4, 72.0, 11.8)));
    }

    @PostMapping("/save")
    public ResponseEntity<?> savePortfolio(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        if (email == null || email.isBlank()) {
            email = "guest";
        }

        double capital;
        double riskLimit;
        double liquidityLimit;
        double expectedReturn;

        try {
            capital = body.get("capital") != null ? Double.parseDouble(body.get("capital").toString()) : 10000000.0;
            riskLimit = body.get("riskLimit") != null ? Double.parseDouble(body.get("riskLimit").toString()) : 12.4;
            liquidityLimit = body.get("liquidityLimit") != null ? Double.parseDouble(body.get("liquidityLimit").toString()) : 72.0;
            expectedReturn = body.get("expectedReturn") != null ? Double.parseDouble(body.get("expectedReturn").toString()) : 11.8;
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid numeric values provided."));
        }

        if (capital <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Capital amount must be greater than ₹0."));
        }
        if (riskLimit < 0 || riskLimit > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Risk limit must be between 0% and 100%."));
        }
        if (liquidityLimit < 0 || liquidityLimit > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Liquidity limit must be between 0% and 100%."));
        }

        Optional<Portfolio> existingOpt = portfolioRepository.findByUserEmail(email);
        Portfolio portfolio;
        if (existingOpt.isPresent()) {
            portfolio = existingOpt.get();
            portfolio.setCapital(capital);
            portfolio.setRiskLimit(riskLimit);
            portfolio.setLiquidityLimit(liquidityLimit);
            portfolio.setExpectedReturn(expectedReturn);
            portfolio.setUpdatedAt(LocalDateTime.now());
        } else {
            portfolio = new Portfolio(email, capital, riskLimit, liquidityLimit, expectedReturn);
        }

        Portfolio saved = portfolioRepository.save(portfolio);
        return ResponseEntity.ok(Map.of(
                "message", "Portfolio configuration saved successfully!",
                "portfolio", saved
        ));
    }
}

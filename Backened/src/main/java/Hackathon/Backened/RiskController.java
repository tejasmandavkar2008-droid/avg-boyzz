package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/risk")
public class RiskController {

    @Autowired
    private RiskEngineService riskEngineService;

    @Autowired(required = false)
    private PortfolioRepository portfolioRepository;

    @Autowired(required = false)
    private RiskResolutionRepository riskResolutionRepository;

    @Autowired(required = false)
    private RiskReminderRepository riskReminderRepository;

    /**
     * Get live real risk report computed directly from the user's active portfolio & stock orders in database
     */
    @GetMapping("/my-portfolio")
    public ResponseEntity<RiskReport> getMyPortfolioRisk(
            @RequestParam(required = false, defaultValue = "guest") String email) {
        return ResponseEntity.ok(riskEngineService.evaluateUserLivePortfolio(email));
    }

    /**
     * Get default risk evaluation report for user or guest
     */
    @GetMapping("/metrics")
    public ResponseEntity<RiskReport> getRiskMetrics(
            @RequestParam(required = false, defaultValue = "guest") String email,
            @RequestParam(required = false, defaultValue = "10000000") Double capital,
            @RequestParam(required = false, defaultValue = "55") Double equityPct,
            @RequestParam(required = false, defaultValue = "25") Double bondsPct,
            @RequestParam(required = false, defaultValue = "10") Double goldPct,
            @RequestParam(required = false, defaultValue = "10") Double cashPct,
            @RequestParam(required = false, defaultValue = "20") Double requiredLiquidityPct,
            @RequestParam(required = false, defaultValue = "40") Double maxConcentrationLimitPct,
            @RequestParam(required = false, defaultValue = "95") Double confidenceLevel) {

        RiskEvaluationRequest req = new RiskEvaluationRequest();
        req.setUserEmail(email);
        req.setCapital(capital);
        req.setEquityPct(equityPct);
        req.setBondsPct(bondsPct);
        req.setGoldPct(goldPct);
        req.setCashPct(cashPct);
        req.setRequiredLiquidityPct(requiredLiquidityPct);
        req.setMaxStockConcentrationLimitPct(maxConcentrationLimitPct);
        req.setConfidenceLevel(confidenceLevel);

        return ResponseEntity.ok(riskEngineService.evaluateRisk(req));
    }

    /**
     * Evaluate custom portfolio allocation with real-time financial risk calculation
     */
    @PostMapping("/evaluate")
    public ResponseEntity<RiskReport> evaluateRisk(@RequestBody RiskEvaluationRequest request) {
        return ResponseEntity.ok(riskEngineService.evaluateRisk(request));
    }

    /**
     * Test risk engine breach simulation (e.g. stock A = 65%, liquidity = 13%)
     */
    @GetMapping("/simulate-breach")
    public ResponseEntity<RiskReport> simulateBreach(
            @RequestParam(required = false, defaultValue = "10000000") Double capital) {

        RiskEvaluationRequest req = new RiskEvaluationRequest();
        req.setCapital(capital);
        req.setEquityPct(75.0);
        req.setBondsPct(10.0);
        req.setGoldPct(10.0);
        req.setCashPct(5.0);
        req.setRequiredLiquidityPct(20.0);
        req.setMaxStockConcentrationLimitPct(40.0);
        req.setConfidenceLevel(95.0);

        req.setCustomHoldings(List.of(
                Map.of("symbol", "STOCK_A", "name", "Stock A (High Concentration)", "weightPct", 65.0, "assetClass", "Equity"),
                Map.of("symbol", "STOCK_B", "name", "Stock B", "weightPct", 10.0, "assetClass", "Equity"),
                Map.of("symbol", "GOLD", "name", "Gold ETF", "weightPct", 10.0, "assetClass", "Gold"),
                Map.of("symbol", "BONDS", "name", "Sovereign Bonds", "weightPct", 10.0, "assetClass", "Bonds"),
                Map.of("symbol", "CASH", "name", "Liquid Cash", "weightPct", 5.0, "assetClass", "Cash")
        ));

        return ResponseEntity.ok(riskEngineService.evaluateRisk(req));
    }

    /**
     * Store a risk resolution / breach cure rebalance event into database table 'risk_resolutions'
     */
    @PostMapping("/resolve")
    public ResponseEntity<Map<String, Object>> saveRiskResolution(@RequestBody RiskResolutionRequest req) {
        if (req.getUserEmail() == null || req.getUserEmail().isBlank()) {
            req.setUserEmail("guest");
        }
        if (req.getCapital() == null) {
            req.setCapital(10000000.0);
        }

        RiskResolution resolution = new RiskResolution(
                req.getUserEmail(),
                req.getCapital(),
                req.getTriggerAction() != null ? req.getTriggerAction() : "APPLY_CONSTRAINED_REBALANCE",
                req.getPreviousBreachCount() != null ? req.getPreviousBreachCount() : 1,
                req.getResolvedBreachTypes() != null ? req.getResolvedBreachTypes() : "CONCENTRATION_BREACH, LIQUIDITY_DEFICIT",
                req.getPreviousVaR() != null ? req.getPreviousVaR() : 8.2,
                req.getResolvedVaR() != null ? req.getResolvedVaR() : 5.1,
                req.getPreviousStockPct() != null ? req.getPreviousStockPct() : 60.0,
                req.getResolvedStockPct() != null ? req.getResolvedStockPct() : 35.0,
                req.getResolvedBondsPct() != null ? req.getResolvedBondsPct() : 35.0,
                req.getResolvedGoldPct() != null ? req.getResolvedGoldPct() : 15.0,
                req.getResolvedCashPct() != null ? req.getResolvedCashPct() : 15.0,
                req.getResolvedLiquidityRatio() != null ? req.getResolvedLiquidityRatio() : 15.0,
                req.getStatus() != null ? req.getStatus() : "CURED",
                req.getResolutionSummary() != null ? req.getResolutionSummary() : "Constrained optimization resolved all policy breaches. VaR cured to 5.1%."
        );

        RiskResolution saved = null;
        if (riskResolutionRepository != null) {
            saved = riskResolutionRepository.save(resolution);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Risk resolution event successfully stored in database table 'risk_resolutions'.",
                "resolutionId", saved != null ? saved.getId() : -1L,
                "data", saved != null ? saved : resolution
        ));
    }

    /**
     * Fetch all past risk resolution events from database for audit trail
     */
    @GetMapping("/resolutions")
    public ResponseEntity<List<RiskResolution>> getRiskResolutions(
            @RequestParam(required = false, defaultValue = "guest") String email) {
        if (riskResolutionRepository != null) {
            return ResponseEntity.ok(riskResolutionRepository.findByUserEmailOrderByCreatedAtDesc(email));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * -------------------------------------------------------------
     * MARKET STEP-DOWN & RISK LIMIT REMINDER NOTIFICATIONS
     * -------------------------------------------------------------
     */

    /**
     * Fetch active reminders and market step-down alerts from database table 'risk_reminders'
     */
    @GetMapping("/reminders")
    public ResponseEntity<List<RiskReminder>> getRiskReminders(
            @RequestParam(required = false, defaultValue = "guest") String email) {
        if (riskReminderRepository != null) {
            return ResponseEntity.ok(riskReminderRepository.findByUserEmailOrderByCreatedAtDesc(email));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * Trigger / record a market step-down or risk breach reminder event into database table 'risk_reminders'
     */
    @PostMapping("/reminders/trigger")
    public ResponseEntity<Map<String, Object>> triggerRiskReminder(@RequestBody RiskReminderRequest req) {
        String email = (req.getUserEmail() != null && !req.getUserEmail().isBlank()) ? req.getUserEmail() : "guest";
        Double cap = req.getPortfolioCapital() != null ? req.getPortfolioCapital() : 10000000.0;
        Double limit = req.getConfiguredRiskLimit() != null ? req.getConfiguredRiskLimit() : 12.4;
        Double currentRisk = req.getCurrentMarketRisk() != null ? req.getCurrentMarketRisk() : 16.5;
        Double drop = req.getMarketDropPct() != null ? req.getMarketDropPct() : -6.2;
        String type = req.getAlertType() != null ? req.getAlertType() : "MARKET_STEP_DOWN";
        String sev = req.getSeverity() != null ? req.getSeverity() : "CRITICAL";
        String msg = req.getMessage() != null ? req.getMessage() : 
                String.format("Market Step-Down Warning: Market decline of %.1f%% has pushed your portfolio risk to %.1f%%, exceeding your configured risk limit of %.1f%%.",
                        Math.abs(drop), currentRisk, limit);

        RiskReminder reminder = new RiskReminder(email, cap, limit, currentRisk, drop, type, sev, msg);

        RiskReminder saved = null;
        if (riskReminderRepository != null) {
            saved = riskReminderRepository.save(reminder);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Market step-down reminder logged in database table 'risk_reminders'.",
                "reminder", saved != null ? saved : reminder
        ));
    }

    /**
     * Dismiss / mark a reminder as read
     */
    @PutMapping("/reminders/{id}/dismiss")
    public ResponseEntity<Map<String, Object>> dismissReminder(@PathVariable Long id) {
        if (riskReminderRepository != null) {
            riskReminderRepository.findById(id).ifPresent(r -> {
                r.setIsRead(true);
                riskReminderRepository.save(r);
            });
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Reminder acknowledged."));
    }
}

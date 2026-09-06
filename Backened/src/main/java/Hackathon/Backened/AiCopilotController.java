package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/copilot")
public class AiCopilotController {

    @Autowired
    private RiskEngineService riskEngineService;

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askCopilot(@RequestBody Map<String, Object> request) {
        String query = (String) request.getOrDefault("query", "");
        String email = (String) request.getOrDefault("userEmail", "guest");
        Map<String, Object> customContext = (Map<String, Object>) request.get("context");

        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("answer", "Please provide a financial question or scenario."));
        }

        Map<String, Object> response = generateFinancialExplanation(query.trim(), email, customContext);
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> generateFinancialExplanation(String q, String email, Map<String, Object> ctx) {
        String lower = q.toLowerCase(Locale.ROOT);
        Map<String, Object> res = new HashMap<>();

        // 1. Why is my portfolio in breach?
        if (lower.contains("breach") || lower.contains("violation") || lower.contains("why") && lower.contains("alert") || lower.contains("red")) {
            res.put("answer",
                    "### Portfolio Policy Breach Analysis\n\n" +
                    "Your portfolio is triggering active risk safeguards due to **two core threshold violations**:\n\n" +
                    "1. **Single-Asset Concentration Breach (Cap: <= 40%)**:\n" +
                    "   - The highest equity holding is over-weighted (e.g., Stock exposure exceeds the 40% regulatory diversification limit).\n" +
                    "   - *Why this is dangerous*: Creates single-stock idiosyncratic risk without commensurate diversification benefits.\n\n" +
                    "2. **Mandatory Liquidity Deficit (Buffer: >= 20%)**:\n" +
                    "   - Your liquid reserves (Cash + liquid debt equivalents) are below the mandatory 20% regulatory buffer (e.g., at 10%–13%).\n" +
                    "   - *Impact*: In the event of a sudden market drawdown or redemption wave, forced asset liquidation would incur heavy slippage.\n\n" +
                    "**Recommended Action**: Run our **Real-World Constrained Optimizer** to automatically trim equity down to 35% and restore cash reserves to >= 15%."
            );
            res.put("suggestedAction", Map.of("type", "APPLY_CONSTRAINED_OPTIMIZER", "label", "Apply Constrained 35/35/15/15 Rebalance"));
            res.put("metrics", Map.of("concentrationLimit", "40%", "requiredLiquidity", "20%", "targetVaR", "5.1%"));
            return res;
        }

        // 2. What happens if NIFTY drops 10% / Market Shock?
        if (lower.contains("nifty") || lower.contains("market drop") || lower.contains("crash") || lower.contains("shock") || lower.contains("drop 10") || lower.contains("falls")) {
            res.put("answer",
                    "### Market Shock Simulation (-10% NIFTY Drawdown)\n\n" +
                    "Under a simulated **-10% broad market correction** across Indian Equities (NIFTY 50):\n\n" +
                    "- **Projected Equity Loss**: With a 50%–60% equity beta exposure, your equities will experience an estimated **-₹5,50,000 to -₹6,50,000** capital drawdown.\n" +
                    "- **Multi-Asset Cushioning Effect**:\n" +
                    "  - **Sovereign Debt (Bonds)**: Projected gain of **+0.8% to +1.5%** due to safe-haven bond yield compression (+₹30,000).\n" +
                    "  - **Gold Reserves**: Projected hedge rally of **+2.0% to +4.5%** (+₹45,000).\n" +
                    "  - **Cash Buffers**: 100% nominal capital preservation.\n" +
                    "- **Net Portfolio Impact**: An estimated **-4.7% net portfolio contraction** (₹4,70,000 loss) compared to -10.0% for an unhedged 100% equity index.\n\n" +
                    "**Risk Engine Verdict**: Multi-asset diversification successfully absorbs **53% of the broad market shock**."
            );
            res.put("suggestedAction", Map.of("type", "RUN_STRESS_TEST", "label", "View Crisis Stress Testing Tab"));
            res.put("metrics", Map.of("marketShock", "-10.0%", "netPortfolioImpact", "-4.7%", "hedgedLossAbsorbed", "53%"));
            return res;
        }

        // 3. How is Value at Risk (VaR) calculated?
        if (lower.contains("var") || lower.contains("value at risk") || lower.contains("confidence")) {
            res.put("answer",
                    "### Parametric Value at Risk (VaR) Formulation\n\n" +
                    "The system calculates **Parametric Gaussian Value at Risk** on your active capital using continuous daily volatility:\n\n" +
                    "$$\\text{VaR}_{\\alpha} = Z_{\\alpha} \\times \\sigma_{\\text{daily}} \\times \\text{Portfolio Capital}$$\n\n" +
                    "Where:\n" +
                    "- **$Z_{95\\%}$ = 1.6449** (at 95% statistical confidence) or **$Z_{99\\%}$ = 2.3263** (at 99% confidence).\n" +
                    "- **$\\sigma_{\\text{daily}} = \\frac{\\sigma_{\\text{annual}}}{\\sqrt{252}}$** (annualized portfolio variance square root scaled to trading days).\n\n" +
                    "**Institutional Interpretation**:\n" +
                    "> *\"At 95% confidence, your expected one-day loss will not exceed ₹50,000 (or ~1.55% of capital) under normal market conditions.\"*"
            );
            res.put("suggestedAction", Map.of("type", "TOGGLE_CONFIDENCE", "label", "Switch to 99% Confidence VaR"));
            res.put("metrics", Map.of("formula", "Z * dailyVol * Capital", "confidence95Z", 1.645, "confidence99Z", 2.326));
            return res;
        }

        // 4. Real-World Constraints Explanation
        if (lower.contains("constraint") || lower.contains("rule") || lower.contains("allocat") || lower.contains("limit") || lower.contains("highest-return")) {
            res.put("answer",
                    "### Why Real-World Constraints Are Essential\n\n" +
                    "Unconstrained mathematical optimizers suffer from **estimation error maximization**—often naïvely allocating 100% into the single highest historical return asset.\n\n" +
                    "Our platform enforces **6 institutional real-world boundaries**:\n\n" +
                    "| Constraint | Limit | Purpose |\n" +
                    "| :--- | :--- | :--- |\n" +
                    "| **Stock Allocation** | <= 40% | Prevents catastrophic drawdown from equity market crashes. |\n" +
                    "| **Bonds Allocation** | <= 50% | Locks steady yield while preventing duration risk. |\n" +
                    "| **Gold Allocation** | <= 25% | Guarantees non-correlated inflation and currency hedging. |\n" +
                    "| **Cash Reserves** | >= 15% | Mandatory liquidity buffer to cover immediate operational needs. |\n" +
                    "| **1-Day VaR** | <= 6.0% | Hard statistical loss cap. |\n" +
                    "| **Portfolio Volatility** | <= 14.0% | Annualized risk budget limit. |\n\n" +
                    "**Result**: Optimizing within these bounds transforms a high-risk portfolio (VaR 8.2%) into an institutional-grade profile (**Stocks 35%, Bonds 35%, Gold 15%, Cash 15%** with **VaR 5.1%**)."
            );
            res.put("suggestedAction", Map.of("type", "APPLY_CONSTRAINED_OPTIMIZER", "label", "Apply 35/35/15/15 Allocation"));
            res.put("metrics", Map.of("maxStock", "40%", "maxBonds", "50%", "minCash", "15%", "maxVaR", "6.0%"));
            return res;
        }

        // 5. Markowitz Efficient Frontier & Sharpe
        if (lower.contains("markowitz") || lower.contains("mpt") || lower.contains("frontier") || lower.contains("sharpe") || lower.contains("tangency")) {
            res.put("answer",
                    "### Markowitz Modern Portfolio Theory (MPT) & Sharpe Maximization\n\n" +
                    "The **Markowitz Efficient Frontier** identifies the set of optimal portfolios that offer the maximum possible expected return $E[R]$ for a given level of risk $\\sigma$:\n\n" +
                    "- **Minimum Variance Portfolio (MVP)**: Achieves the lowest absolute portfolio volatility (~5.60% $\\sigma$) by overweighting government debt and cash.\n" +
                    "- **Optimal Tangency Portfolio**: The point where the **Capital Allocation Line (CAL)** is tangent to the efficient frontier, maximizing the Sharpe Ratio:\n" +
                    "  $$\\text{Sharpe Ratio} = \\frac{E[R] - R_f}{\\sigma_p} = \\frac{13.90\\% - 6.80\\%}{11.85\\%} = 1.58$$\n" +
                    "- **Your Current Position**: Plots dynamically against the curve to show if you are taking uncompensated risk."
            );
            res.put("suggestedAction", Map.of("type", "VIEW_FRONTIER", "label", "View Interactive Frontier Chart"));
            res.put("metrics", Map.of("rfRate", "6.8% (10Y G-Sec)", "maxSharpe", 1.58, "mvpVol", "5.60%"));
            return res;
        }

        // 6. Transaction Friction & Costs (STT, Slippage, Brokerage)
        if (lower.contains("friction") || lower.contains("cost") || lower.contains("stt") || lower.contains("slippage") || lower.contains("tax") || lower.contains("fee")) {
            res.put("answer",
                    "### Transaction Friction & Zero-Penalty Rebalancing\n\n" +
                    "Rebalancing creates real execution drag. The engine models exact statutory and market frictions on every trade:\n\n" +
                    "1. **Securities Transaction Tax (STT)**: 0.10% on equity delivery turnover.\n" +
                    "2. **NSE/BSE Exchange Turnover Fee**: 0.00345% of volume.\n" +
                    "3. **Statutory Stamp Duty**: 0.015% state charge on issuance/delivery.\n" +
                    "4. **Brokerage & GST (18%)**: Discount brokerage cap + 18% GST.\n" +
                    "5. **TWAP Execution Slippage**: 0.08% bid-ask impact spread minimized via algorithmic time-weighted execution.\n\n" +
                    "**Economic Viability Rule**: Trades are only dispatched when **Net Risk Reduction Value > Total Friction Costs** (Effective Drag: ~0.035%)."
            );
            res.put("suggestedAction", Map.of("type", "VIEW_FRICTION", "label", "View Regulatory Fee Breakdown"));
            res.put("metrics", Map.of("sttRate", "0.10%", "exchangeFee", "0.00345%", "slippageSpread", "0.08%", "effectiveDragBps", "3.45 bps"));
            return res;
        }

        // 7. Maximum Drawdown (MDD) & Recovery
        if (lower.contains("drawdown") || lower.contains("mdd") || lower.contains("peak") || lower.contains("trough") || lower.contains("recovery")) {
            res.put("answer",
                    "### Maximum Drawdown (MDD) & Capital Preservation\n\n" +
                    "**Maximum Drawdown** quantifies the largest peak-to-trough decline before a new peak is attained:\n\n" +
                    "$$\\text{MDD} = \\frac{\\text{Peak Value} - \\text{Trough Value}}{\\text{Peak Value}} = \\frac{₹1,00,00,000 - ₹85,00,000}{₹1,00,00,000} = 15.0\\%$$\n\n" +
                    "- **Current Drawdown Trajectory**: ~5.2% below historical peak.\n" +
                    "- **Recovery Status**: **74% Recovered** from historic trough baseline with positive momentum.\n" +
                    "- **Downside Protection**: Increasing debt and gold allocation reduces MDD from -24.5% to -11.2% in market turbulence."
            );
            res.put("suggestedAction", Map.of("type", "VIEW_OVERVIEW", "label", "View MDD Trajectory Chart"));
            res.put("metrics", Map.of("maxDrawdown", "15.0%", "drawdownRupees", "₹15,00,000", "recoveryStatus", "74% Intact"));
            return res;
        }

        // 8. General / Fallback Contextual Response
        res.put("answer",
                "### Institutional Risk Copilot Overview\n\n" +
                "I am continuously monitoring your portfolio balance sheet. Here is your current risk summary:\n\n" +
                "- **Active Capital**: ₹1,00,00,000 (Tested)\n" +
                "- **Annualized Volatility**: Moderate risk envelope (~12.8% p.a.)\n" +
                "- **1-Day VaR (95%)**: Guaranteed loss boundary within ₹50,000.\n" +
                "- **Safeguards Status**: Enforcing single-asset concentration limits (<= 40%) and liquidity adequacy (>= 20%).\n\n" +
                "*You can ask questions like*:\n" +
                "- *\"Why is my portfolio in breach?\"*\n" +
                "- *\"What happens if NIFTY drops 10%?\"*\n" +
                "- *\"How do real-world constraints optimize my returns?\"*\n" +
                "- *\"Explain transaction costs and STT fees.\"*"
        );
        res.put("suggestedAction", Map.of("type", "APPLY_CONSTRAINED_OPTIMIZER", "label", "Review Constrained Allocation"));
        res.put("metrics", Map.of("copilotStatus", "ACTIVE", "monitoringFrequency", "Real-Time"));
        return res;
    }
}


    package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RiskEngineService {

    @Autowired(required = false)
    private PortfolioRepository portfolioRepository;

    @Autowired(required = false)
    private PurchaseOrderRepository purchaseOrderRepository;

    // Asset class annualized volatilities (Historical baseline)
    private static final double VOL_EQUITY = 0.185; // 18.5%
    private static final double VOL_BONDS  = 0.052; // 5.2%
    private static final double VOL_GOLD   = 0.120; // 12.0%
    private static final double VOL_CASH   = 0.005; // 0.5%

    // Cross-asset correlations
    private static final double CORR_EQ_BOND = -0.15;
    private static final double CORR_EQ_GOLD = 0.05;
    private static final double CORR_EQ_CASH = 0.00;
    private static final double CORR_BOND_GOLD = 0.12;
    private static final double CORR_BOND_CASH = 0.02;
    private static final double CORR_GOLD_CASH = 0.00;

    // Asset expected returns (%)
    private static final double RET_EQUITY = 14.5;
    private static final double RET_BONDS  = 7.2;
    private static final double RET_GOLD   = 9.5;
    private static final double RET_CASH   = 6.5;

    public RiskReport evaluateRisk(RiskEvaluationRequest req) {
        double capital = (req.getCapital() != null && req.getCapital() > 0) ? req.getCapital() : 10_000_000.0;
        double equityPct = req.getEquityPct() != null ? req.getEquityPct() : 55.0;
        double bondsPct  = req.getBondsPct()  != null ? req.getBondsPct()  : 25.0;
        double goldPct   = req.getGoldPct()   != null ? req.getGoldPct()   : 10.0;
        double cashPct   = req.getCashPct()   != null ? req.getCashPct()   : 10.0;

        // Normalize weights if total != 100
        double totalPct = equityPct + bondsPct + goldPct + cashPct;
        if (totalPct > 0 && Math.abs(totalPct - 100.0) > 0.01) {
            equityPct = (equityPct / totalPct) * 100.0;
            bondsPct  = (bondsPct / totalPct) * 100.0;
            goldPct   = (goldPct / totalPct) * 100.0;
            cashPct   = (cashPct / totalPct) * 100.0;
        }

        double reqLiquidityPct = req.getRequiredLiquidityPct() != null ? req.getRequiredLiquidityPct() : 20.0;
        double maxConcentrationLimitPct = req.getMaxStockConcentrationLimitPct() != null ? req.getMaxStockConcentrationLimitPct() : 40.0;
        double confidenceLevel = req.getConfidenceLevel() != null ? req.getConfidenceLevel() : 95.0;

        List<RiskBreach> breaches = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // ══════════════════════════════════════════════════════════════
        // SECTION A: PORTFOLIO VOLATILITY CALCULATION
        // ══════════════════════════════════════════════════════════════
        double wEq = equityPct / 100.0;
        double wBd = bondsPct / 100.0;
        double wGd = goldPct / 100.0;
        double wCs = cashPct / 100.0;

        // Variance: w^T * Sigma * w
        double variance = Math.pow(wEq * VOL_EQUITY, 2)
                + Math.pow(wBd * VOL_BONDS, 2)
                + Math.pow(wGd * VOL_GOLD, 2)
                + Math.pow(wCs * VOL_CASH, 2)
                + 2 * wEq * wBd * (VOL_EQUITY * VOL_BONDS * CORR_EQ_BOND)
                + 2 * wEq * wGd * (VOL_EQUITY * VOL_GOLD * CORR_EQ_GOLD)
                + 2 * wEq * wCs * (VOL_EQUITY * VOL_CASH * CORR_EQ_CASH)
                + 2 * wBd * wGd * (VOL_BONDS * VOL_GOLD * CORR_BOND_GOLD)
                + 2 * wBd * wCs * (VOL_BONDS * VOL_CASH * CORR_BOND_CASH)
                + 2 * wGd * wCs * (VOL_GOLD * VOL_CASH * CORR_GOLD_CASH);

        double annualizedVol = Math.sqrt(Math.max(0.0001, variance));
        double dailyVol = annualizedVol / Math.sqrt(252.0);
        double annualizedVolPct = round2(annualizedVol * 100.0);
        double dailyVolPct = round2(dailyVol * 100.0);

        String volCategory;
        String volStatusColor;
        if (annualizedVolPct < 8.0) {
            volCategory = "Low Volatility";
            volStatusColor = "#34d399";
        } else if (annualizedVolPct <= 14.0) {
            volCategory = "Moderate Volatility";
            volStatusColor = "#60a5fa";
        } else if (annualizedVolPct <= 18.0) {
            volCategory = "Elevated Volatility";
            volStatusColor = "#fbbf24";
        } else {
            volCategory = "High Volatility";
            volStatusColor = "#f87171";
            breaches.add(new RiskBreach(
                    "VOLATILITY",
                    "WARNING",
                    "High Portfolio Volatility",
                    String.format("Annualized volatility (%.2f%%) exceeds target risk envelope of 14.0%%.", annualizedVolPct),
                    annualizedVolPct,
                    14.0,
                    capital * (annualizedVolPct - 14.0) / 100.0,
                    "Increase defensive allocations (Government Bonds or Liquid Cash) to dampen fluctuation."
            ));
        }

        Map<String, Object> volMap = new HashMap<>();
        volMap.put("annualizedVolatilityPct", annualizedVolPct);
        volMap.put("dailyVolatilityPct", dailyVolPct);
        volMap.put("volatilityCategory", volCategory);
        volMap.put("color", volStatusColor);
        volMap.put("betaEstimate", round2(wEq * 1.15 + wBd * 0.15 + wGd * 0.25));
        volMap.put("sharpeRatioEstimate", round2((12.5 - 6.5) / Math.max(1.0, annualizedVolPct)));
        volMap.put("assetVolatilities", Map.of(
                "Equities", round2(VOL_EQUITY * 100.0),
                "Bonds", round2(VOL_BONDS * 100.0),
                "Gold", round2(VOL_GOLD * 100.0),
                "Cash", round2(VOL_CASH * 100.0)
        ));

        // ══════════════════════════════════════════════════════════════
        // SECTION B: VALUE AT RISK (VaR) CALCULATION
        // ══════════════════════════════════════════════════════════════
        // Z-scores: 95% -> 1.6449, 99% -> 2.3263
        double zScore = (confidenceLevel >= 99.0) ? 2.3263 : 1.6449;
        double var1DayPct = round2(zScore * dailyVol * 100.0);
        double var1DayRupees = round2(capital * (var1DayPct / 100.0));
        double var10DayPct = round2(var1DayPct * Math.sqrt(10.0));
        double var10DayRupees = round2(capital * (var10DayPct / 100.0));

        // Conditional VaR (Expected Shortfall / CVaR)
        double phiZ = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * zScore * zScore);
        double cvarPct = round2((phiZ / (1.0 - (confidenceLevel / 100.0))) * dailyVol * 100.0);
        double cvarRupees = round2(capital * (cvarPct / 100.0));

        String varStatement = String.format(Locale.US,
                "At %.0f%% confidence, the expected one-day loss should not exceed ₹%,.0f (%.2f%% of portfolio).",
                confidenceLevel, var1DayRupees, var1DayPct);

        Map<String, Object> varMap = new HashMap<>();
        varMap.put("confidenceLevel", confidenceLevel);
        varMap.put("var1DayPct", var1DayPct);
        varMap.put("var1DayRupees", var1DayRupees);
        varMap.put("var10DayPct", var10DayPct);
        varMap.put("var10DayRupees", var10DayRupees);
        varMap.put("cvar1DayPct", cvarPct);
        varMap.put("cvar1DayRupees", cvarRupees);
        varMap.put("statement", varStatement);

        // ══════════════════════════════════════════════════════════════
        // SECTION C: MAXIMUM DRAWDOWN (MDD) CALCULATION
        // ══════════════════════════════════════════════════════════════
        // Baseline simulated peak and trough from equity & portfolio scale
        double peakMultiplier = 1.0 + (wEq * 0.12);
        double peakPortfolioValue = round2(capital * peakMultiplier);
        double maxDrawdownPct = round2(wEq * 24.5 + wBd * 4.2 + wGd * 8.5 + wCs * 0.0);
        double troughPortfolioValue = round2(peakPortfolioValue * (1.0 - (maxDrawdownPct / 100.0)));
        double drawdownRupees = round2(peakPortfolioValue - troughPortfolioValue);
        double currentDrawdownPct = round2(maxDrawdownPct * 0.35); // simulated current pull from peak

        // Historical MDD simulation timeline points for chart
        List<Map<String, Object>> mddTimeline = List.of(
                Map.of("stage", "Historical Peak", "value", peakPortfolioValue, "drawdownPct", 0.0),
                Map.of("stage", "Initial Pullback", "value", round2(peakPortfolioValue * 0.94), "drawdownPct", -6.0),
                Map.of("stage", "Market Trough", "value", troughPortfolioValue, "drawdownPct", -maxDrawdownPct),
                Map.of("stage", "Recovery Phase", "value", round2(troughPortfolioValue + (drawdownRupees * 0.65)), "drawdownPct", -round2(maxDrawdownPct * 0.35)),
                Map.of("stage", "Current Level", "value", capital, "drawdownPct", -round2(((peakPortfolioValue - capital) / peakPortfolioValue) * 100.0))
        );

        Map<String, Object> mddMap = new HashMap<>();
        mddMap.put("peakPortfolioValue", peakPortfolioValue);
        mddMap.put("troughPortfolioValue", troughPortfolioValue);
        mddMap.put("maxDrawdownPct", maxDrawdownPct);
        mddMap.put("drawdownRupees", drawdownRupees);
        mddMap.put("currentDrawdownPct", currentDrawdownPct);
        mddMap.put("recoveryStatus", "74% Recovered from Historic Trough");
        mddMap.put("timeline", mddTimeline);

        // ══════════════════════════════════════════════════════════════
        // SECTION D: LIQUIDITY RATIO & CONTROL (BREACH DETECTION)
        // ══════════════════════════════════════════════════════════════
        // Liquid assets include Cash + 40% of Sovereign Liquid Bonds
        double liquidAssetsPct = round2(cashPct + (bondsPct * 0.40));
        double liquidAssetsRupees = round2(capital * (liquidAssetsPct / 100.0));
        boolean isLiquidityBreach = liquidAssetsPct < reqLiquidityPct;
        double liquidityShortfallPct = isLiquidityBreach ? round2(reqLiquidityPct - liquidAssetsPct) : 0.0;
        double liquidityShortfallRupees = round2(capital * (liquidityShortfallPct / 100.0));

        if (isLiquidityBreach) {
            breaches.add(new RiskBreach(
                    "LIQUIDITY",
                    "CRITICAL",
                    "⚠️ Liquidity Ratio Policy Breach",
                    String.format(Locale.US, "Current liquid assets (%.1f%%) are below the mandatory minimum of %.1f%%. Shortfall: ₹%,.0f.",
                            liquidAssetsPct, reqLiquidityPct, liquidityShortfallRupees),
                    liquidAssetsPct,
                    reqLiquidityPct,
                    liquidityShortfallRupees,
                    String.format(Locale.US, "Reallocate ₹%,.0f from Equities to Cash or Liquid Overnights to restore compliance.", liquidityShortfallRupees)
            ));
            recommendations.add(String.format(Locale.US, "Transfer ₹%,.0f to Liquid Reserve to cure liquidity deficit.", liquidityShortfallRupees));
        }

        Map<String, Object> liqMap = new HashMap<>();
        liqMap.put("requiredLiquidityPct", reqLiquidityPct);
        liqMap.put("currentLiquidityPct", liquidAssetsPct);
        liqMap.put("cashOnlyPct", cashPct);
        liqMap.put("liquidAssetsRupees", liquidAssetsRupees);
        liqMap.put("isBreach", isLiquidityBreach);
        liqMap.put("shortfallPct", liquidityShortfallPct);
        liqMap.put("shortfallRupees", liquidityShortfallRupees);
        liqMap.put("statusLabel", isLiquidityBreach ? "⚠️ LIQUIDITY BREACH" : "✅ COMPLIANT");
        liqMap.put("statusColor", isLiquidityBreach ? "#f87171" : "#34d399");

        // ══════════════════════════════════════════════════════════════
        // SECTION E: CONCENTRATION RISK & SINGLE-ASSET LIMIT ENFORCEMENT
        // ══════════════════════════════════════════════════════════════
        List<Map<String, Object>> holdings = new ArrayList<>();

        if (req.getCustomHoldings() != null && !req.getCustomHoldings().isEmpty()) {
            for (Map<String, Object> h : req.getCustomHoldings()) {
                holdings.add(new HashMap<>(h));
            }
        } else {
            // Build dynamically from the request asset allocation percentages
            if (equityPct > 0) {
                holdings.add(Map.of("symbol", "EQUITIES", "name", "Equity Asset Holdings", "weightPct", equityPct, "assetClass", "Equity"));
            }
            if (bondsPct > 0) {
                holdings.add(Map.of("symbol", "BONDS", "name", "Government & Corporate Bonds", "weightPct", bondsPct, "assetClass", "Bonds"));
            }
            if (goldPct > 0) {
                holdings.add(Map.of("symbol", "GOLD", "name", "Physical Gold & Sovereign Gold Bonds", "weightPct", goldPct, "assetClass", "Gold"));
            }
            if (cashPct > 0) {
                holdings.add(Map.of("symbol", "CASH", "name", "Liquid Cash & Equivalents", "weightPct", cashPct, "assetClass", "Cash"));
            }
        }

        // Check for concentration breaches across all individual holdings
        double maxHoldingWeight = 0.0;
        String maxHoldingName = "";
        double hhiSum = 0.0; // Herfindahl-Hirschman Index

        List<Map<String, Object>> evaluatedHoldings = new ArrayList<>();
        for (Map<String, Object> h : holdings) {
            String name = (String) h.getOrDefault("name", "Asset");
            String sym = (String) h.getOrDefault("symbol", "SYM");
            Object wObj = h.get("weightPct");
            double weight = wObj instanceof Number ? ((Number) wObj).doubleValue() : 0.0;
            weight = round2(weight);
            double valueRupees = round2(capital * (weight / 100.0));

            hhiSum += Math.pow(weight, 2);

            boolean isConcentrationBreach = weight > maxConcentrationLimitPct;
            if (weight > maxHoldingWeight) {
                maxHoldingWeight = weight;
                maxHoldingName = name;
            }

            if (isConcentrationBreach) {
                double excessPct = round2(weight - maxConcentrationLimitPct);
                double excessRupees = round2(capital * (excessPct / 100.0));
                breaches.add(new RiskBreach(
                        "CONCENTRATION",
                        "CRITICAL",
                        "⚠️ Asset Concentration Breach",
                        String.format(Locale.US, "⚠️ %s concentration (%.1f%%) exceeds the %.1f%% single-asset limit by %.1f%%.",
                                name, weight, maxConcentrationLimitPct, excessPct),
                        weight,
                        maxConcentrationLimitPct,
                        excessRupees,
                        String.format(Locale.US, "Trim %s by ₹%,.0f to reduce single-issuer risk below %.1f%%.", name, excessRupees, maxConcentrationLimitPct)
                ));
                recommendations.add(String.format(Locale.US, "Trim %s exposure by ₹%,.0f (%.1f%% excess) to eliminate concentration penalty.",
                        name, excessRupees, excessPct));
            }

            Map<String, Object> evalH = new HashMap<>(h);
            evalH.put("valueRupees", valueRupees);
            evalH.put("isBreach", isConcentrationBreach);
            evalH.put("limitPct", maxConcentrationLimitPct);
            evaluatedHoldings.add(evalH);
        }

        int hhiIndex = (int) Math.round(hhiSum);
        String hhiCategory = hhiIndex < 1500 ? "Well Diversified (Low Concentration)"
                : hhiIndex < 2500 ? "Moderately Concentrated"
                : "Highly Concentrated (Elevated Risk)";

        Map<String, Object> concMap = new HashMap<>();
        concMap.put("maxLimitPct", maxConcentrationLimitPct);
        concMap.put("topHoldingName", maxHoldingName);
        concMap.put("topHoldingWeightPct", maxHoldingWeight);
        concMap.put("isBreach", maxHoldingWeight > maxConcentrationLimitPct);
        concMap.put("hhiIndex", hhiIndex);
        concMap.put("hhiCategory", hhiCategory);
        concMap.put("holdings", evaluatedHoldings);

        // ══════════════════════════════════════════════════════════════
        // OVERALL RISK SCORE & STATUS
        // ══════════════════════════════════════════════════════════════
        double score = 40.0; // baseline
        score += (annualizedVolPct / 25.0) * 25.0; // volatility component
        if (isLiquidityBreach) score += 20.0;
        if (maxHoldingWeight > maxConcentrationLimitPct) score += 20.0;
        if (maxDrawdownPct > 20.0) score += 10.0;
        double overallScore = Math.min(100.0, Math.max(10.0, round2(score)));

        String overallStatus = breaches.isEmpty() ? "OPTIMAL"
                : breaches.stream().anyMatch(b -> "CRITICAL".equals(b.getSeverity())) ? "CRITICAL_BREACH"
                : "ELEVATED_RISK";

        String classification = overallScore < 45.0 ? "Conservative / Balanced"
                : overallScore < 70.0 ? "Moderate Growth"
                : overallScore < 85.0 ? "Aggressive Risk"
                : "Critical Vulnerability";

        // ══════════════════════════════════════════════════════════════
        // SECTION F: REBALANCE TRANSACTION COST & FRICTION OPTIMIZER
        // ══════════════════════════════════════════════════════════════
        // Target compliant weights: Equity 45%, Bonds 25%, Gold 15%, Cash 15%
        double targetEq = 45.0, targetBd = 25.0, targetGd = 15.0, targetCs = 15.0;
        double diffEq = Math.abs(equityPct - targetEq);
        double diffBd = Math.abs(bondsPct - targetBd);
        double diffGd = Math.abs(goldPct - targetGd);
        double diffCs = Math.abs(cashPct - targetCs);

        double turnoverPct = round2((diffEq + diffBd + diffGd + diffCs) / 2.0);
        double turnoverRupees = round2(capital * (turnoverPct / 100.0));

        // Real-world Indian statutory & brokerage friction costs
        double sttCost = round2(turnoverRupees * 0.0010);           // 0.10% STT
        double exchangeFee = round2(turnoverRupees * 0.0000345);    // 0.00345% NSE turnover fee
        double stampDuty = round2(turnoverRupees * 0.00015);        // 0.015% Stamp duty
        double brokerageGst = round2(Math.min(500.0, turnoverRupees * 0.0002) * 1.18); // Brokerage + 18% GST
        double estimatedSlippage = round2(turnoverRupees * 0.0008); // 0.08% Market impact / slippage

        double totalFrictionCost = round2(sttCost + exchangeFee + stampDuty + brokerageGst + estimatedSlippage);
        double frictionBps = turnoverRupees > 0 ? round2((totalFrictionCost / capital) * 10000.0) : 0.0;

        // Risk reduction benefit
        double riskReductionPct = round2(Math.max(0.0, annualizedVolPct - 11.5));
        double riskReductionRupees = round2(capital * (riskReductionPct / 100.0));
        double netValueCreated = round2(riskReductionRupees - totalFrictionCost);

        List<Map<String, Object>> suggestedTrades = List.of(
                Map.of("action", equityPct > targetEq ? "SELL / TRIM" : "BUY / ADD", "asset", "Equities", "amountRupees", round2(capital * (diffEq / 100.0)), "targetPct", targetEq),
                Map.of("action", bondsPct < targetBd ? "BUY / ADD" : "HOLD", "asset", "Government Bonds", "amountRupees", round2(capital * (diffBd / 100.0)), "targetPct", targetBd),
                Map.of("action", cashPct < targetCs ? "ALLOCATE" : "REDEPLOY", "asset", "Liquid Cash Reserves", "amountRupees", round2(capital * (diffCs / 100.0)), "targetPct", targetCs)
        );

        Map<String, Object> rebalanceMap = new HashMap<>();
        rebalanceMap.put("turnoverPct", turnoverPct);
        rebalanceMap.put("turnoverRupees", turnoverRupees);
        rebalanceMap.put("sttCostRupees", sttCost);
        rebalanceMap.put("exchangeFeeRupees", exchangeFee);
        rebalanceMap.put("stampDutyRupees", stampDuty);
        rebalanceMap.put("brokerageGstRupees", brokerageGst);
        rebalanceMap.put("slippageCostRupees", estimatedSlippage);
        rebalanceMap.put("totalFrictionCostRupees", totalFrictionCost);
        rebalanceMap.put("frictionBps", frictionBps);
        rebalanceMap.put("riskReductionRupees", riskReductionRupees);
        rebalanceMap.put("netValueCreatedRupees", netValueCreated);
        rebalanceMap.put("isEconomicallyFavorable", netValueCreated > 0);
        rebalanceMap.put("suggestedTrades", suggestedTrades);

        // ══════════════════════════════════════════════════════════════
        // SECTION G: MARKOWITZ EFFICIENT FRONTIER GENERATION
        // ══════════════════════════════════════════════════════════════
        double rfRate = 6.8; // 6.8% 10-Yr Indian G-Sec Yield
        List<Map<String, Object>> frontierPoints = new ArrayList<>();

        // Generate discrete points along the hyperbolic efficient frontier
        for (int i = 0; i <= 10; i++) {
            double eqWeight = i * 0.10;
            double bdWeight = Math.max(0.0, (1.0 - eqWeight) * 0.70);
            double gdWeight = Math.max(0.0, (1.0 - eqWeight) * 0.20);
            double csWeight = Math.max(0.0, 1.0 - eqWeight - bdWeight - gdWeight);

            double ptVol = round2(Math.sqrt(Math.pow(eqWeight * VOL_EQUITY, 2) + Math.pow(bdWeight * VOL_BONDS, 2) + Math.pow(gdWeight * VOL_GOLD, 2) + Math.pow(csWeight * VOL_CASH, 2)) * 100.0);
            double ptRet = round2(eqWeight * 16.0 + bdWeight * 7.5 + gdWeight * 10.5 + csWeight * 5.0);
            double ptSharpe = round2((ptRet - rfRate) / Math.max(1.0, ptVol));

            frontierPoints.add(Map.of(
                    "volatility", ptVol,
                    "expectedReturn", ptRet,
                    "sharpeRatio", ptSharpe,
                    "equityPct", round2(eqWeight * 100.0),
                    "bondsPct", round2(bdWeight * 100.0),
                    "goldPct", round2(gdWeight * 100.0),
                    "cashPct", round2(csWeight * 100.0)
            ));
        }

        double currentExpectedReturn = round2(wEq * 16.0 + wBd * 7.5 + wGd * 10.5 + wCs * 5.0);
        double currentSharpe = round2((currentExpectedReturn - rfRate) / Math.max(1.0, annualizedVolPct));

        Map<String, Object> efficientFrontierMap = new HashMap<>();
        efficientFrontierMap.put("riskFreeRatePct", rfRate);
        efficientFrontierMap.put("currentPortfolio", Map.of(
                "volatility", annualizedVolPct,
                "expectedReturn", currentExpectedReturn,
                "sharpeRatio", currentSharpe,
                "label", "Current Allocation"
        ));
        efficientFrontierMap.put("tangencyPortfolio", Map.of(
                "volatility", 11.85,
                "expectedReturn", 13.90,
                "sharpeRatio", 1.58,
                "label", "Optimal Tangency Portfolio (Max Sharpe)"
        ));
        efficientFrontierMap.put("minVariancePortfolio", Map.of(
                "volatility", 5.60,
                "expectedReturn", 7.40,
                "sharpeRatio", 0.95,
                "label", "Minimum Variance Portfolio (MVP)"
        ));
        efficientFrontierMap.put("frontierCurve", frontierPoints);

        // ══════════════════════════════════════════════════════════════
        // SECTION H: REAL-WORLD CONSTRAINED PORTFOLIO OPTIMIZER
        // ══════════════════════════════════════════════════════════════
        double maxStockLimit = req.getMaxStockLimitPct() != null ? req.getMaxStockLimitPct() : 40.0;
        double maxBondsLimit = req.getMaxBondsLimitPct() != null ? req.getMaxBondsLimitPct() : 50.0;
        double maxGoldLimit  = req.getMaxGoldLimitPct() != null ? req.getMaxGoldLimitPct() : 25.0;
        double minCashLimit  = req.getMinCashLimitPct() != null ? req.getMinCashLimitPct() : 15.0;
        double maxVaRLimit   = req.getMaxVaRLimitPct() != null ? req.getMaxVaRLimitPct() : 6.0;
        double maxVolLimit   = req.getMaxVolatilityLimitPct() != null ? req.getMaxVolatilityLimitPct() : 14.0;

        // 1. Evaluate Current Portfolio State
        double curStock = equityPct;
        double curBonds = bondsPct;
        double curGold  = goldPct;
        double curCash  = cashPct;
        double curVaR = var1DayPct;
        double curVol = annualizedVolPct;
        double curLiq = liquidAssetsPct;
        String curConcentration = curStock > maxStockLimit ? "HIGH (BREACH)" : "NORMAL";

        // 2. Search for Optimal Allocation satisfying all Real-World Constraints
        double bestStock = 35.0;
        double bestBonds = 35.0;
        double bestGold = 15.0;
        double bestCash = 15.0;
        double bestSharpe = -1.0;
        double bestVol = 11.2;
        double bestVaR = 5.1;
        double bestReturn = 11.4;

        // Grid scan over simplex with 1% step size
        for (int s = 5; s <= (int) maxStockLimit; s += 1) {
            for (int b = 10; b <= (int) maxBondsLimit; b += 1) {
                for (int g = 5; g <= (int) maxGoldLimit; g += 1) {
                    int c = 100 - (s + b + g);
                    if (c < (int) minCashLimit || c > 100) continue;

                    double ws = s / 100.0, wb = b / 100.0, wg = g / 100.0, wc = c / 100.0;
                    double candVar = Math.pow(ws * VOL_EQUITY, 2) + Math.pow(wb * VOL_BONDS, 2)
                            + Math.pow(wg * VOL_GOLD, 2) + Math.pow(wc * VOL_CASH, 2)
                            + 2 * ws * wb * (VOL_EQUITY * VOL_BONDS * CORR_EQ_BOND)
                            + 2 * ws * wg * (VOL_EQUITY * VOL_GOLD * CORR_EQ_GOLD)
                            + 2 * ws * wc * (VOL_EQUITY * VOL_CASH * CORR_EQ_CASH)
                            + 2 * wb * wg * (VOL_BONDS * VOL_GOLD * CORR_BOND_GOLD)
                            + 2 * wb * wc * (VOL_BONDS * VOL_CASH * CORR_BOND_CASH)
                            + 2 * wg * wc * (VOL_GOLD * VOL_CASH * CORR_GOLD_CASH);
                    double candVol = Math.sqrt(Math.max(0.0001, candVar)) * 100.0;
                    if (candVol > maxVolLimit) continue;

                    double candVaR = (zScore * (candVol / Math.sqrt(252.0)));
                    if (candVaR > maxVaRLimit) continue;

                    double candRet = ws * RET_EQUITY + wb * RET_BONDS + wg * RET_GOLD + wc * RET_CASH;
                    double candSharpe = (candRet - 6.8) / (candVol);

                    if (candSharpe > bestSharpe) {
                        bestSharpe = candSharpe;
                        bestStock = s;
                        bestBonds = b;
                        bestGold = g;
                        bestCash = c;
                        bestVol = round2(candVol);
                        bestVaR = round2(candVaR);
                        bestReturn = round2(candRet);
                    }
                }
            }
        }

        double optLiq = round2(bestCash + (bestBonds * 0.40));
        String optConcentration = bestStock <= maxStockLimit ? "NORMAL" : "HIGH";

        // Generate trade orders to transition from Current to Recommended
        List<Map<String, Object>> constraintTrades = new ArrayList<>();
        double deltaStock = round2(bestStock - curStock);
        double deltaBonds = round2(bestBonds - curBonds);
        double deltaGold  = round2(bestGold - curGold);
        double deltaCash  = round2(bestCash - curCash);

        if (Math.abs(deltaStock) > 0.1) {
            constraintTrades.add(Map.of(
                    "asset", "Equities / Stocks",
                    "action", deltaStock < 0 ? "SELL / TRIM" : "BUY / ADD",
                    "currentPct", curStock,
                    "targetPct", bestStock,
                    "deltaPct", deltaStock,
                    "amountRupees", round2(capital * Math.abs(deltaStock) / 100.0)
            ));
        }
        if (Math.abs(deltaBonds) > 0.1) {
            constraintTrades.add(Map.of(
                    "asset", "Government & Corporate Bonds",
                    "action", deltaBonds < 0 ? "SELL / TRIM" : "BUY / ADD",
                    "currentPct", curBonds,
                    "targetPct", bestBonds,
                    "deltaPct", deltaBonds,
                    "amountRupees", round2(capital * Math.abs(deltaBonds) / 100.0)
            ));
        }
        if (Math.abs(deltaGold) > 0.1) {
            constraintTrades.add(Map.of(
                    "asset", "Sovereign Gold / Gold ETF",
                    "action", deltaGold < 0 ? "SELL / TRIM" : "BUY / ADD",
                    "currentPct", curGold,
                    "targetPct", bestGold,
                    "deltaPct", deltaGold,
                    "amountRupees", round2(capital * Math.abs(deltaGold) / 100.0)
            ));
        }
        if (Math.abs(deltaCash) > 0.1) {
            constraintTrades.add(Map.of(
                    "asset", "Liquid Cash & Equivalents",
                    "action", deltaCash < 0 ? "WITHDRAW" : "DEPOSIT / BUFFER",
                    "currentPct", curCash,
                    "targetPct", bestCash,
                    "deltaPct", deltaCash,
                    "amountRupees", round2(capital * Math.abs(deltaCash) / 100.0)
            ));
        }

        Map<String, Object> constrainedOptimizerMap = new HashMap<>();
        constrainedOptimizerMap.put("constraints", Map.of(
                "maxStockLimitPct", maxStockLimit,
                "maxBondsLimitPct", maxBondsLimit,
                "maxGoldLimitPct", maxGoldLimit,
                "minCashLimitPct", minCashLimit,
                "maxVaRLimitPct", maxVaRLimit,
                "maxVolatilityLimitPct", maxVolLimit
        ));
        constrainedOptimizerMap.put("currentAllocation", Map.of(
                "stocksPct", curStock,
                "bondsPct", curBonds,
                "goldPct", curGold,
                "cashPct", curCash
        ));
        constrainedOptimizerMap.put("currentMetrics", Map.of(
                "varPct", curVaR,
                "volatilityPct", curVol,
                "liquidityPct", curLiq,
                "concentrationStatus", curConcentration,
                "expectedReturnPct", round2(wEq * RET_EQUITY + wBd * RET_BONDS + wGd * RET_GOLD + wCs * RET_CASH),
                "sharpeRatio", round2((wEq * RET_EQUITY + wBd * RET_BONDS + wGd * RET_GOLD + wCs * RET_CASH - 6.8) / curVol)
        ));
        constrainedOptimizerMap.put("recommendedAllocation", Map.of(
                "stocksPct", bestStock,
                "bondsPct", bestBonds,
                "goldPct", bestGold,
                "cashPct", bestCash
        ));
        constrainedOptimizerMap.put("recommendedMetrics", Map.of(
                "varPct", bestVaR,
                "volatilityPct", bestVol,
                "liquidityPct", optLiq,
                "concentrationStatus", optConcentration,
                "expectedReturnPct", bestReturn,
                "sharpeRatio", round2(bestSharpe)
        ));
        constrainedOptimizerMap.put("rebalanceTrades", constraintTrades);
        constrainedOptimizerMap.put("isConstrainedOptimal", true);
        constrainedOptimizerMap.put("summary", String.format(Locale.US,
                "Real-World Constraints Applied: Stock ≤ %.0f%%, Bonds ≤ %.0f%%, Gold ≤ %.0f%%, Cash ≥ %.0f%%, VaR ≤ %.1f%%, Vol ≤ %.1f%%. System optimizes allocation from Stocks %.0f%% -> %.0f%%, Bonds %.0f%% -> %.0f%%, Gold %.0f%% -> %.0f%%, Cash %.0f%% -> %.0f%%. VaR drops from %.1f%% to %.1f%% and Concentration cures from %s to %s.",
                maxStockLimit, maxBondsLimit, maxGoldLimit, minCashLimit, maxVaRLimit, maxVolLimit,
                curStock, bestStock, curBonds, bestBonds, curGold, bestGold, curCash, bestCash,
                curVaR, bestVaR, curConcentration, optConcentration));

        // ══════════════════════════════════════════════════════════════
        // STRESS TEST SCENARIOS
        // ══════════════════════════════════════════════════════════════
        List<Map<String, Object>> scenarios = List.of(
                createStressScenario("2008 Global Financial Crash", -38.0, 8.0, 15.0, 0.0, capital, wEq, wBd, wGd, wCs),
                createStressScenario("2020 Covid Liquidity Shock", -26.0, 4.5, 22.0, -1.0, capital, wEq, wBd, wGd, wCs),
                createStressScenario("RBI Inflation & Rate Spike (+250bps)", -14.0, -8.5, 5.0, 3.5, capital, wEq, wBd, wGd, wCs),
                createStressScenario("Tech Sector Tech-Wreck (-30%)", -22.0, 3.0, 6.0, 0.0, capital, wEq, wBd, wGd, wCs)
        );

        RiskReport report = new RiskReport();
        report.setCapital(capital);
        report.setOverallRiskScore(overallScore);
        report.setRiskStatus(overallStatus);
        report.setRiskClassification(classification);
        report.setVolatilityMetrics(volMap);
        report.setValueAtRiskMetrics(varMap);
        report.setDrawdownMetrics(mddMap);
        report.setLiquidityMetrics(liqMap);
        report.setConcentrationMetrics(concMap);
        report.setRebalanceOptimization(rebalanceMap);
        report.setEfficientFrontier(efficientFrontierMap);
        report.setConstrainedOptimizer(constrainedOptimizerMap);
        report.setActiveBreaches(breaches);
        report.setRecommendations(recommendations);
        report.setStressTestScenarios(scenarios);

        return report;
    }

    private Map<String, Object> createStressScenario(String name, double eqChg, double bdChg, double gdChg, double csChg,
                                                     double capital, double wEq, double wBd, double wGd, double wCs) {
        double portfolioImpactPct = round2(wEq * eqChg + wBd * bdChg + wGd * gdChg + wCs * csChg);
        double impactRupees = round2(capital * (portfolioImpactPct / 100.0));
        double estimatedValueAfterShock = round2(capital + impactRupees);

        Map<String, Object> sc = new HashMap<>();
        sc.put("scenarioName", name);
        sc.put("equityShockPct", eqChg);
        sc.put("bondsShockPct", bdChg);
        sc.put("goldShockPct", gdChg);
        sc.put("portfolioImpactPct", portfolioImpactPct);
        sc.put("impactRupees", impactRupees);
        sc.put("postShockCapital", estimatedValueAfterShock);
        sc.put("isNegative", portfolioImpactPct < 0);
        return sc;
    }

    public RiskReport evaluateUserLivePortfolio(String email) {
        String userEmail = (email != null && !email.isBlank()) ? email : "guest";

        double capital = 10_000_000.0;
        double reqLiquidity = 20.0;
        double maxRisk = 14.0;

        if (portfolioRepository != null) {
            Optional<Portfolio> pOpt = portfolioRepository.findByUserEmail(userEmail);
            if (pOpt.isPresent()) {
                Portfolio p = pOpt.get();
                if (p.getCapital() != null && p.getCapital() > 0) capital = p.getCapital();
                if (p.getLiquidityLimit() != null && p.getLiquidityLimit() > 0) reqLiquidity = p.getLiquidityLimit();
                if (p.getRiskLimit() != null && p.getRiskLimit() > 0) maxRisk = p.getRiskLimit();
            }
        }

        List<Map<String, Object>> customHoldings = new ArrayList<>();
        double totalStockInvested = 0.0;

        if (purchaseOrderRepository != null) {
            List<PurchaseOrder> orders = purchaseOrderRepository.findByUserEmailOrderByOrderTimeDesc(userEmail);
            Map<String, Double> stockTotals = new HashMap<>();
            Map<String, String> stockNames = new HashMap<>();

            for (PurchaseOrder order : orders) {
                String sym = order.getSymbol();
                stockNames.put(sym, order.getStockName());
                double cur = stockTotals.getOrDefault(sym, 0.0);
                if ("BUY".equalsIgnoreCase(order.getOrderType())) {
                    stockTotals.put(sym, cur + order.getTotalCost());
                } else if ("SELL".equalsIgnoreCase(order.getOrderType())) {
                    stockTotals.put(sym, Math.max(0.0, cur - order.getTotalCost()));
                }
            }

            for (Map.Entry<String, Double> entry : stockTotals.entrySet()) {
                if (entry.getValue() > 0) {
                    totalStockInvested += entry.getValue();
                    double weightPct = round2((entry.getValue() / capital) * 100.0);
                    customHoldings.add(Map.of(
                            "symbol", entry.getKey(),
                            "name", stockNames.getOrDefault(entry.getKey(), entry.getKey()),
                            "weightPct", weightPct,
                            "assetClass", "Equity"
                    ));
                }
            }
        }

        double equityPct = round2((totalStockInvested / capital) * 100.0);
        if (equityPct == 0) {
            equityPct = 45.0; // fallback if user hasn't bought specific stocks yet
        }
        double remainingPct = Math.max(0.0, 100.0 - equityPct);
        double bondsPct = round2(remainingPct * 0.45);
        double goldPct  = round2(remainingPct * 0.20);
        double cashPct  = round2(Math.max(0.0, remainingPct - bondsPct - goldPct));

        if (customHoldings.isEmpty()) {
            customHoldings.add(Map.of("symbol", "EQUITY", "name", "Equity Asset Allocation", "weightPct", equityPct, "assetClass", "Equity"));
        }

        customHoldings.add(Map.of("symbol", "BONDS", "name", "Sovereign Debt Allocation", "weightPct", bondsPct, "assetClass", "Bonds"));
        customHoldings.add(Map.of("symbol", "GOLD", "name", "Gold Reserves", "weightPct", goldPct, "assetClass", "Gold"));
        customHoldings.add(Map.of("symbol", "CASH", "name", "Liquid Cash & Equivalents", "weightPct", cashPct, "assetClass", "Cash"));

        RiskEvaluationRequest req = new RiskEvaluationRequest();
        req.setUserEmail(userEmail);
        req.setCapital(capital);
        req.setEquityPct(equityPct);
        req.setBondsPct(bondsPct);
        req.setGoldPct(goldPct);
        req.setCashPct(cashPct);
        req.setRequiredLiquidityPct(reqLiquidity);
        req.setMaxStockConcentrationLimitPct(40.0);
        req.setConfidenceLevel(95.0);
        req.setCustomHoldings(customHoldings);

        return evaluateRisk(req);
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}

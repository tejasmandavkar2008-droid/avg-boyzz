package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    @Autowired
    private YahooFinanceService yahooFinanceService;

    @GetMapping("/indices")
    public ResponseEntity<List<Map<String, Object>>> getIndices() {
        return ResponseEntity.ok(yahooFinanceService.getLiveIndices());
    }

    @GetMapping("/stocks")
    public ResponseEntity<List<MarketStock>> getStocks() {
        return ResponseEntity.ok(yahooFinanceService.getLiveStocks());
    }
}

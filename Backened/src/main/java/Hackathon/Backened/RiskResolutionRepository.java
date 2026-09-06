package Hackathon.Backened;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskResolutionRepository extends JpaRepository<RiskResolution, Long> {
    List<RiskResolution> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}

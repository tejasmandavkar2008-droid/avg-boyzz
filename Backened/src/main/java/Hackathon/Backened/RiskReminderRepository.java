package Hackathon.Backened;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskReminderRepository extends JpaRepository<RiskReminder, Long> {
    List<RiskReminder> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<RiskReminder> findByUserEmailAndIsReadFalseOrderByCreatedAtDesc(String userEmail);
}

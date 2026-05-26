package com.realestate.management.repository;

import com.realestate.management.entity.ReputationHistory;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReputationHistoryRepository extends JpaRepository<ReputationHistory, Long> {
    
    List<ReputationHistory> findByUserOrderByCreatedAtDesc(User user);
    
    List<ReputationHistory> findTop10ByUserOrderByCreatedAtDesc(User user);
}

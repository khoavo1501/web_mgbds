package com.realestate.management.repository;

import com.realestate.management.entity.AuditLog;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorId(Long actorId);
    
    List<AuditLog> findByAction(String action);
    
    List<AuditLog> findByActorIdOrderByTimestampDesc(Long actorId);
}

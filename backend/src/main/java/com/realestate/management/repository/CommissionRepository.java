package com.realestate.management.repository;

import com.realestate.management.entity.Commission;
import com.realestate.management.entity.Transaction;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, Long> {

    List<Commission> findByTransaction(Transaction transaction);
    
    List<Commission> findByUser(User user);
    
    List<Commission> findByStatus(String status);
    
    List<Commission> findByUserAndStatus(User user, String status);
}

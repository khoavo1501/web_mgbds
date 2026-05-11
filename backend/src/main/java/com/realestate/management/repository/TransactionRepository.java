package com.realestate.management.repository;

import com.realestate.management.entity.Property;
import com.realestate.management.entity.Transaction;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionCode(String transactionCode);
    
    boolean existsByTransactionCode(String transactionCode);
    
    List<Transaction> findByStatus(String status);
    
    List<Transaction> findByCustomer(User customer);
    
    List<Transaction> findByBroker(User broker);
    
    List<Transaction> findByProperty(Property property);
    
    List<Transaction> findByBrokerAndStatus(User broker, String status);
}

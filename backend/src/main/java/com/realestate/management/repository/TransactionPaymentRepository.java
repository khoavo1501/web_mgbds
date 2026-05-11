package com.realestate.management.repository;

import com.realestate.management.entity.Transaction;
import com.realestate.management.entity.TransactionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionPaymentRepository extends JpaRepository<TransactionPayment, Long> {

    List<TransactionPayment> findByTransaction(Transaction transaction);
    
    List<TransactionPayment> findByPaymentMethod(String paymentMethod);
}

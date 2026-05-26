package com.realestate.management.repository;

import com.realestate.management.entity.Transaction;
import com.realestate.management.entity.TransactionDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionDocumentRepository extends JpaRepository<TransactionDocument, Long> {
    List<TransactionDocument> findByTransaction_TransactionId(Long transactionId);
    List<TransactionDocument> findByTransaction(Transaction transaction);
    void deleteByTransaction(Transaction transaction);
}

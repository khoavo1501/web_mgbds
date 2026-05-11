package com.realestate.management.repository;

import com.realestate.management.entity.Contract;
import com.realestate.management.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByTransaction(Transaction transaction);
    
    Optional<Contract> findByTransactionAndContractType(Transaction transaction, String contractType);
    
    List<Contract> findByContractType(String contractType);
}

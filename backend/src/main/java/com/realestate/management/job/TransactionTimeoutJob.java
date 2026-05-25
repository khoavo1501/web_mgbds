package com.realestate.management.job;

import com.realestate.management.entity.Transaction;
import com.realestate.management.repository.PropertyRepository;
import com.realestate.management.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class TransactionTimeoutJob {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Scheduled(fixedRate = 60000) // Chạy mỗi phút
    @Transactional
    public void cancelExpiredTransactions() {
        LocalDateTime now = LocalDateTime.now();
        List<Transaction> pendingTransactions = transactionRepository.findByStatusIn(
                List.of("pending", "customer_confirmed", "documents_verified")
        );

        for (Transaction tx : pendingTransactions) {
            LocalDateTime expiredAt = tx.getExpiredAt();
            
            // Only transactions with an explicit deadline should be auto-cancelled.
            if (expiredAt == null) {
                continue;
            }

            if (now.isAfter(expiredAt)) {
                tx.setStatus("cancelled");
                transactionRepository.save(tx);
                
                if (tx.getProperty() != null) {
                    tx.getProperty().setIsLocked(false);
                    // Nếu nó đang in_transaction thì trả về published
                    if ("in_transaction".equals(tx.getProperty().getStatus())) {
                        tx.getProperty().setStatus("published");
                    }
                    propertyRepository.save(tx.getProperty());
                }
            }
        }
    }
}

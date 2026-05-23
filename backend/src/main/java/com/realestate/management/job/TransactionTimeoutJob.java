package com.realestate.management.job;

import com.realestate.management.entity.Property;
import com.realestate.management.entity.Transaction;
import com.realestate.management.repository.PropertyRepository;
import com.realestate.management.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class TransactionTimeoutJob {

    private static final Logger logger = LoggerFactory.getLogger(TransactionTimeoutJob.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /**
     * Chạy mỗi 15 phút (900000 ms)
     * Kiểm tra các giao dịch quá hạn thanh toán cọc
     */
    @Scheduled(fixedRate = 900000)
    public void cancelExpiredTransactions() {
        logger.info("Running Transaction Timeout Job...");
        
        List<Transaction> allTransactions = transactionRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Transaction t : allTransactions) {
            if ("deposit_pending".equals(t.getStatus()) && t.getExpiredAt() != null && t.getExpiredAt().isBefore(now)) {
                logger.info("Cancelling expired transaction: " + t.getTransactionCode());
                
                // 1. Đổi trạng thái giao dịch
                t.setStatus("cancelled");
                transactionRepository.save(t);

                // 2. Nhả lock cho BĐS
                Property p = t.getProperty();
                p.setIsLocked(false);
                propertyRepository.save(p);
            }
        }
    }
}

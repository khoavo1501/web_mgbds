package com.realestate.management.service;

import com.realestate.management.dto.TransactionDTO;
import com.realestate.management.dto.TransactionRequest;
import com.realestate.management.entity.*;
import com.realestate.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CommissionRepository commissionRepository;

    /** Lấy danh sách giao dịch theo role */
    public List<TransactionDTO> getMyTransactions() {
        User currentUser = getCurrentUser();
        List<Transaction> list;

        switch (currentUser.getRole().toLowerCase()) {
            case "broker"   -> list = transactionRepository.findByBroker(currentUser);
            case "customer" -> list = transactionRepository.findByCustomer(currentUser);
            default         -> list = transactionRepository.findAll(); // admin
        }

        return list.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /** Lấy chi tiết 1 giao dịch */
    public TransactionDTO getTransactionById(Long id) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        return convertToDTO(t);
    }

    /** Tạo giao dịch mới (Broker) */
    @Transactional
    public TransactionDTO createTransaction(TransactionRequest request) {
        User broker = getCurrentUser();

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BĐS ID: " + request.getPropertyId()));

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng ID: " + request.getCustomerId()));

        // Tạo mã giao dịch
        String code = generateTransactionCode();

        Transaction transaction = new Transaction();
        transaction.setTransactionCode(code);
        transaction.setProperty(property);
        transaction.setCustomer(customer);
        transaction.setBroker(broker);
        transaction.setTotalPrice(request.getTotalPrice());
        transaction.setDepositAmount(request.getDepositAmount() != null ? request.getDepositAmount() : java.math.BigDecimal.ZERO);
        transaction.setStatus("pending");
        transaction.setTransactionDate(LocalDate.now());

        Transaction saved = transactionRepository.save(transaction);

        // Tự động tạo hoa hồng 2% cho broker
        Commission commission = new Commission();
        commission.setTransaction(saved);
        commission.setUser(broker);
        commission.setAmount(request.getTotalPrice().multiply(new java.math.BigDecimal("0.02")));
        commission.setStatus("pending");
        commissionRepository.save(commission);

        return convertToDTO(saved);
    }

    /** Cập nhật trạng thái giao dịch */
    @Transactional
    public TransactionDTO updateStatus(Long id, String status) {
        if (!status.matches("pending|completed|cancelled")) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        t.setStatus(status);

        // Nếu hoàn thành → cập nhật hoa hồng thành paid
        if ("completed".equals(status)) {
            commissionRepository.findByTransaction(t).forEach(c -> {
                c.setStatus("paid");
                commissionRepository.save(c);
            });
        }

        return convertToDTO(transactionRepository.save(t));
    }

    private synchronized String generateTransactionCode() {
        String prefix = "TXN-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        List<Transaction> all = transactionRepository.findAll();
        int max = all.stream()
                .filter(t -> t.getTransactionCode() != null && t.getTransactionCode().startsWith(prefix))
                .mapToInt(t -> {
                    try { return Integer.parseInt(t.getTransactionCode().substring(prefix.length())); }
                    catch (Exception e) { return 0; }
                }).max().orElse(0);
        return String.format("%s%04d", prefix, max + 1);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    private TransactionDTO convertToDTO(Transaction t) {
        TransactionDTO dto = new TransactionDTO();
        dto.setTransactionId(t.getTransactionId());
        dto.setTransactionCode(t.getTransactionCode());
        dto.setTotalPrice(t.getTotalPrice());
        dto.setDepositAmount(t.getDepositAmount());
        dto.setStatus(t.getStatus());
        dto.setTransactionDate(t.getTransactionDate());

        if (t.getProperty() != null) {
            dto.setPropertyId(t.getProperty().getPropertyId());
            dto.setPropertyTitle(t.getProperty().getTitle());
            dto.setPropertyCode(t.getProperty().getPropertyCode());
        }
        if (t.getCustomer() != null) {
            dto.setCustomerId(t.getCustomer().getUserId());
            dto.setCustomerName(t.getCustomer().getFullName());
            dto.setCustomerEmail(t.getCustomer().getEmail());
            dto.setCustomerPhone(t.getCustomer().getPhone());
        }
        if (t.getBroker() != null) {
            dto.setBrokerId(t.getBroker().getUserId());
            dto.setBrokerName(t.getBroker().getFullName());
            dto.setBrokerEmail(t.getBroker().getEmail());
        }
        return dto;
    }
}

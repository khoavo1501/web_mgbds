package com.realestate.management.service;

import com.realestate.management.dto.CommissionDTO;
import com.realestate.management.entity.Commission;
import com.realestate.management.entity.User;
import com.realestate.management.repository.CommissionRepository;
import com.realestate.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommissionService {

    @Autowired private CommissionRepository commissionRepository;
    @Autowired private UserRepository userRepository;

    /** Lấy danh sách hoa hồng theo role */
    public List<CommissionDTO> getMyCommissions() {
        User currentUser = getCurrentUser();
        List<Commission> list;

        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            list = commissionRepository.findByUser(currentUser);
        } else {
            list = commissionRepository.findAll(); // admin
        }

        return list.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /** Tổng hoa hồng của broker hiện tại */
    public BigDecimal getTotalCommission() {
        return getVisibleCommissions().stream()
                .map(Commission::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Tổng hoa hồng đã nhận (paid) */
    public BigDecimal getPaidCommission() {
        return getVisibleCommissions().stream()
                .filter(c -> "paid".equalsIgnoreCase(c.getStatus()))
                .map(Commission::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Tổng hoa hồng đang chờ (pending) */
    public BigDecimal getPendingCommission() {
        return getVisibleCommissions().stream()
                .filter(c -> "pending".equalsIgnoreCase(c.getStatus()))
                .map(Commission::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Commission> getVisibleCommissions() {
        User currentUser = getCurrentUser();
        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            return commissionRepository.findByUser(currentUser);
        }
        return commissionRepository.findAll();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    private CommissionDTO convertToDTO(Commission c) {
        CommissionDTO dto = new CommissionDTO();
        dto.setCommissionId(c.getCommissionId());
        dto.setAmount(c.getAmount());
        dto.setStatus(c.getStatus());

        if (c.getTransaction() != null) {
            dto.setTransactionId(c.getTransaction().getTransactionId());
            dto.setTransactionCode(c.getTransaction().getTransactionCode());
            dto.setTransactionTotalPrice(c.getTransaction().getTotalPrice());
            if (c.getTransaction().getProperty() != null) {
                dto.setPropertyTitle(c.getTransaction().getProperty().getTitle());
            }
        }
        if (c.getUser() != null) {
            dto.setUserId(c.getUser().getUserId());
            dto.setUserName(c.getUser().getFullName());
        }
        return dto;
    }
}

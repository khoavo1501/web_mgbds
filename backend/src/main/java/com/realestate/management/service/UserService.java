package com.realestate.management.service;

import com.realestate.management.dto.AdminCreateBrokerRequest;
import com.realestate.management.dto.UserDTO;
import com.realestate.management.entity.User;
import com.realestate.management.repository.TransactionRepository;
import com.realestate.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDTO> getUsers(String role, Boolean active) {
        return userRepository.findAll().stream()
                .filter(user -> role == null || role.isBlank() || role.equalsIgnoreCase(user.getRole()))
                .filter(user -> active == null || active.equals(user.getIsActive()))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional
    public UserDTO createBroker(AdminCreateBrokerRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        user.setRole("broker");
        user.setIsActive(true);

        return convertToDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateActiveStatus(Long userId, Boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + userId));

        if ("admin".equalsIgnoreCase(user.getRole()) && Boolean.FALSE.equals(active)) {
            throw new RuntimeException("Không thể khóa tài khoản admin");
        }

        user.setIsActive(active);
        return convertToDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateIdentityStatus(Long userId, String status, String reason) {
        if (!status.matches("verified|rejected|pending_review")) {
            throw new RuntimeException("Trạng thái xác thực hồ sơ không hợp lệ");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + userId));
        if (!"customer".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Chỉ xác thực hồ sơ cho khách hàng");
        }
        if ("verified".equals(status)
                && (user.getCccdFrontUrl() == null || user.getCccdBackUrl() == null || user.getResidenceUrl() == null)) {
            throw new RuntimeException("Khách hàng chưa gửi đủ hồ sơ bắt buộc");
        }
        user.setIdentityVerificationStatus(status);
        user.setIdentityRejectReason("rejected".equals(status) ? reason : null);
        User savedUser = userRepository.save(user);

        if ("verified".equals(status)) {
            transactionRepository.findByCustomer(savedUser).stream()
                    .filter(transaction -> "customer_confirmed".equalsIgnoreCase(transaction.getStatus()))
                    .forEach(transaction -> {
                        transaction.setStatus("documents_verified");
                        transaction.setExpiredAt(java.time.LocalDateTime.now().plusHours(12));
                        transactionRepository.save(transaction);
                    });
        }

        return convertToDTO(savedUser);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setBankName(user.getBankName());
        dto.setBankAccountNumber(user.getBankAccountNumber());
        dto.setBankAccountHolder(user.getBankAccountHolder());
        dto.setIdentityVerificationStatus(user.getIdentityVerificationStatus());
        dto.setCccdFrontUrl(user.getCccdFrontUrl());
        dto.setCccdBackUrl(user.getCccdBackUrl());
        dto.setResidenceUrl(user.getResidenceUrl());
        dto.setIdentityRejectReason(user.getIdentityRejectReason());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}

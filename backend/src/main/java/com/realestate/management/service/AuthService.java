package com.realestate.management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realestate.management.dto.LoginRequest;
import com.realestate.management.dto.LoginResponse;
import com.realestate.management.dto.ProfileUpdateRequest;
import com.realestate.management.dto.RegisterRequest;
import com.realestate.management.dto.UserDTO;
import com.realestate.management.entity.User;
import com.realestate.management.repository.UserRepository;
import com.realestate.management.security.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public User register(RegisterRequest request) {
        if (!"customer".equalsIgnoreCase(request.getRole())) {
            throw new RuntimeException("Chỉ admin mới được tạo tài khoản broker hoặc admin");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole().toLowerCase());
        user.setIsActive(true);

        return userRepository.save(user);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String rawPassword = request.getPassword();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        String storedPassword = user.getPasswordHash();
        boolean matchesPassword = passwordEncoder.matches(rawPassword, storedPassword);
        boolean matchesLegacyPlainText = rawPassword.equals(storedPassword);

        if (!matchesPassword && !matchesLegacyPlainText) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }

        if (matchesLegacyPlainText) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getBankName(),
                user.getBankAccountNumber(),
                user.getBankAccountHolder(),
                user.getIdentityVerificationStatus(),
                user.getCccdFrontUrl(),
                user.getCccdBackUrl(),
                user.getResidenceUrl(),
                user.getIdentityRejectReason(),
                user.getRole()
        );
    }

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser() {
        return toUserDTO(getAuthenticatedUser());
    }

    @Transactional
    public UserDTO updateCurrentUser(ProfileUpdateRequest request) {
        User user = getAuthenticatedUser();
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
        user.setBankName(blankToNull(request.getBankName()));
        user.setBankAccountNumber(blankToNull(request.getBankAccountNumber()));
        user.setBankAccountHolder(blankToNull(request.getBankAccountHolder()));
        boolean identityChanged = hasChanged(user.getCccdFrontUrl(), request.getCccdFrontUrl())
                || hasChanged(user.getCccdBackUrl(), request.getCccdBackUrl())
                || hasChanged(user.getResidenceUrl(), request.getResidenceUrl());
        user.setCccdFrontUrl(blankToNull(request.getCccdFrontUrl()));
        user.setCccdBackUrl(blankToNull(request.getCccdBackUrl()));
        user.setResidenceUrl(blankToNull(request.getResidenceUrl()));
        if (user.getCccdFrontUrl() != null && user.getCccdBackUrl() != null && user.getResidenceUrl() != null
                && (identityChanged || user.getIdentityVerificationStatus() == null || "not_submitted".equals(user.getIdentityVerificationStatus()) || "rejected".equals(user.getIdentityVerificationStatus()))) {
            user.setIdentityVerificationStatus("pending_review");
            user.setIdentityRejectReason(null);
        }
        return toUserDTO(userRepository.save(user));
    }

    private boolean hasChanged(String oldValue, String newValue) {
        String normalizedNew = blankToNull(newValue);
        if (oldValue == null) {
            return normalizedNew != null;
        }
        return !oldValue.equals(normalizedNew);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Bạn cần đăng nhập để thực hiện thao tác này");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    private UserDTO toUserDTO(User user) {
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

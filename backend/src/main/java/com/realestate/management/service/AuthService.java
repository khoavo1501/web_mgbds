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
        return toUserDTO(userRepository.save(user));
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
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}

package com.realestate.management.service;

import com.realestate.management.dto.LoginRequest;
import com.realestate.management.dto.LoginResponse;
import com.realestate.management.dto.RegisterRequest;
import com.realestate.management.entity.User;
import com.realestate.management.repository.UserRepository;
import com.realestate.management.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service xử lý Authentication
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    /**
     * Đăng ký user mới
     */
    @Transactional
    public User register(RegisterRequest request) {
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        // Tạo user mới
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole().toLowerCase());
        user.setIsActive(true);

        return userRepository.save(user);
    }

    /**
     * Đăng nhập
     */
    public LoginResponse login(LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );

            // Lấy thông tin user
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

            // Trả về response
            return new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
            );

        } catch (Exception e) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }
    }
}

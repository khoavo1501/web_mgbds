package com.realestate.management.service;

import com.realestate.management.dto.AdminCreateBrokerRequest;
import com.realestate.management.dto.UserDTO;
import com.realestate.management.entity.User;
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

    private UserDTO convertToDTO(User user) {
        return new UserDTO(
                user.getUserId(),
                user.getEmail(),
                user.getRole(),
                user.getFullName(),
                user.getPhone(),
                user.getIsActive(),
                user.getCreatedAt()
        );
    }
}

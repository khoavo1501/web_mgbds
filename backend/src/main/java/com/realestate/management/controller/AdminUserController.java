package com.realestate.management.controller;

import com.realestate.management.dto.AdminCreateBrokerRequest;
import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.UserDTO;
import com.realestate.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(originPatterns = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active
    ) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", userService.getUsers(role, active)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi lấy danh sách người dùng: " + e.getMessage()));
        }
    }

    @PostMapping("/brokers")
    public ResponseEntity<ApiResponse<UserDTO>> createBroker(@Valid @RequestBody AdminCreateBrokerRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo tài khoản môi giới thành công", userService.createBroker(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{userId}/active")
    public ResponseEntity<ApiResponse<UserDTO>> updateActiveStatus(
            @PathVariable Long userId,
            @RequestParam Boolean active
    ) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công", userService.updateActiveStatus(userId, active)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}

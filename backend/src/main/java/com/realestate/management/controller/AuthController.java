package com.realestate.management.controller;

import com.realestate.management.dto.*;
import com.realestate.management.entity.User;
import com.realestate.management.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller cho Authentication
 * Base URL: /api/auth
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * POST /api/auth/register
     * Đăng ký user mới
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công", user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi đăng ký: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/login
     * Đăng nhập
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(
                ApiResponse.success("Đăng nhập thành công", response)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi đăng nhập: " + e.getMessage()));
        }
    }

    /**
     * GET /api/auth/test
     * Test endpoint
     */
    @GetMapping("/test")
    public ResponseEntity<ApiResponse<String>> test() {
        return ResponseEntity.ok(
            ApiResponse.success("Auth API đang hoạt động", "OK")
        );
    }
}

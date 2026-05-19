package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller for API discovery and health checks.
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> index() {
        Map<String, Object> apiInfo = Map.of(
            "name", "Real Estate Management API",
            "status", "running",
            "health", "/api/health",
            "endpoints", List.of(
                "/api/auth",
                "/api/properties",
                "/api/appointments"
            )
        );

        return ResponseEntity.ok(ApiResponse.success("API dang hoat dong", apiInfo));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        return ResponseEntity.ok(
            ApiResponse.success("Backend dang hoat dong", Map.of("status", "UP"))
        );
    }
}

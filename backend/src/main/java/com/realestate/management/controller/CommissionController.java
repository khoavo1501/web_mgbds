package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.CommissionDTO;
import com.realestate.management.service.CommissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST Controller cho Commission
 * Base URL: /api/commissions
 */
@RestController
@RequestMapping("/api/commissions")
@CrossOrigin(originPatterns = "*")
public class CommissionController {

    @Autowired
    private CommissionService commissionService;

    /**
     * GET /api/commissions
     * Broker thấy hoa hồng của mình, Admin thấy tất cả
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<List<CommissionDTO>>> getCommissions() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hoa hồng thành công",
                    commissionService.getMyCommissions()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * GET /api/commissions/summary
     * Tổng hợp hoa hồng: tổng, đã nhận, đang chờ
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getSummary() {
        try {
            Map<String, BigDecimal> summary = Map.of(
                    "total",   commissionService.getTotalCommission(),
                    "paid",    commissionService.getPaidCommission(),
                    "pending", commissionService.getPendingCommission()
            );
            return ResponseEntity.ok(ApiResponse.success("Lấy tổng hợp hoa hồng thành công", summary));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}

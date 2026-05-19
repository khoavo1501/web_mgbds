package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.LeadDTO;
import com.realestate.management.dto.LeadRequest;
import com.realestate.management.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Lead
 * Base URL: /api/leads
 */
@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class LeadController {

    @Autowired
    private LeadService leadService;

    /**
     * GET /api/leads
     * Broker thấy lead của mình, Admin thấy tất cả
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<List<LeadDTO>>> getLeads() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lead thành công", leadService.getMyLeads()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * POST /api/leads
     * Tạo lead mới (Broker/Admin)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<LeadDTO>> createLead(@Valid @RequestBody LeadRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo lead thành công", leadService.createLead(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * PATCH /api/leads/{id}/status
     * Cập nhật trạng thái lead
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<LeadDTO>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công",
                    leadService.updateLeadStatus(id, status)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * DELETE /api/leads/{id}
     * Xóa lead
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<String>> deleteLead(@PathVariable Long id) {
        try {
            leadService.deleteLead(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa lead thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }
}

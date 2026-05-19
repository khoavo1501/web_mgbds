package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.TransactionDTO;
import com.realestate.management.dto.TransactionRequest;
import com.realestate.management.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Transaction
 * Base URL: /api/transactions
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    /**
     * GET /api/transactions
     * Lấy danh sách giao dịch theo role (broker thấy của mình, admin thấy tất cả)
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TransactionDTO>>> getTransactions() {
        try {
            List<TransactionDTO> list = transactionService.getMyTransactions();
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách giao dịch thành công", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * GET /api/transactions/{id}
     * Lấy chi tiết 1 giao dịch
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TransactionDTO>> getTransaction(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Thành công", transactionService.getTransactionById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/transactions
     * Tạo giao dịch mới (Broker/Admin)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> createTransaction(
            @Valid @RequestBody TransactionRequest request) {
        try {
            TransactionDTO created = transactionService.createTransaction(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo giao dịch thành công", created));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * PATCH /api/transactions/{id}/status
     * Cập nhật trạng thái giao dịch (Admin/Broker)
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công",
                    transactionService.updateStatus(id, status)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}

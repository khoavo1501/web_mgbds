package com.realestate.management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.service.TransactionService;

@RestController
@RequestMapping("/api/demo")
@CrossOrigin(originPatterns = "*")
public class DemoController {

    @Value("${app.dev.demo-mode:false}")
    private boolean demoMode;

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/transactions/{id}/mock-admin-verify")
    public ResponseEntity<ApiResponse<Void>> mockAdminVerify(@PathVariable Long id) {
        if (!demoMode) {
            return ResponseEntity.status(403).body(ApiResponse.error("Demo mode is disabled"));
        }
        transactionService.updateStatus(id, "documents_verified");
        return ResponseEntity.ok(ApiResponse.success("Mock verify documents thành công", null));
    }

    @PostMapping("/transactions/{id}/mock-admin-confirm-payment")
    public ResponseEntity<ApiResponse<Void>> mockAdminConfirmPayment(@PathVariable Long id) {
        if (!demoMode) {
            return ResponseEntity.status(403).body(ApiResponse.error("Demo mode is disabled"));
        }
        transactionService.updateStatus(id, "deposit_paid");
        return ResponseEntity.ok(ApiResponse.success("Mock confirm payment thành công", null));
    }
}

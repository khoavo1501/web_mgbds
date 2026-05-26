package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.AppointmentRequest;
import com.realestate.management.dto.TransactionDTO;
import com.realestate.management.dto.TransactionRequest;
import com.realestate.management.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST Controller cho Transaction
 * Base URL: /api/transactions
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(originPatterns = "*")
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

    @PostMapping("/appointment/{appointmentId}/deposit")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> createDepositFromAppointment(@PathVariable Long appointmentId) {
        try {
            TransactionDTO created = transactionService.createCustomerDepositFromAppointment(appointmentId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Dat coc thanh cong, cho admin xac nhan", created));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 🆕 POST /api/transactions/{id}/submit-deposit
     * Khách hàng submit deposit payment cho giao dịch pending_deposit
     */
    @PostMapping("/{id}/submit-deposit")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> submitDepositPayment(@PathVariable Long id) {
        try {
            TransactionDTO updated = transactionService.submitDepositPayment(id);
            return ResponseEntity.ok(ApiResponse.success("Đã nộp tiền cọc thành công, chờ admin xác nhận", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/confirm-purchase")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> confirmPurchase(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Xác nhận giao dịch thành công",
                    transactionService.updateStatus(id, "customer_confirmed")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = "/{id}/documents")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> submitDocuments(
            @PathVariable Long id,
            @RequestParam("cccdFrontUrl") String cccdFrontUrl,
            @RequestParam("cccdBackUrl") String cccdBackUrl,
            @RequestParam("residenceUrl") String residenceUrl,
            @RequestParam(value = "marriageUrl", required = false) String marriageUrl) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Gửi hồ sơ thành công",
                    transactionService.submitDocuments(id, cccdFrontUrl, cccdBackUrl, residenceUrl, marriageUrl)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/payment-submitted")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> submitPayment(
            @PathVariable Long id,
            @RequestParam("receiptUrl") String receiptUrl) {
        try {
            TransactionDTO updated = transactionService.updateStatus(id, "payment_submitted");
            // Optionally, we could save the receiptUrl as a document in the transaction
            // but for now we just change status and handle URL in service if needed.
            // Wait, we need to save the receiptUrl somewhere!
            transactionService.addPaymentReceipt(id, receiptUrl);
            return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận yêu cầu xác minh thanh toán", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/commitment-signed")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> signCommitment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Đã ký cam kết",
                    transactionService.updateStatus(id, "commitment_signed")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/refund-request")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> requestRefund(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Da gui yeu cau hoan coc",
                    transactionService.updateStatus(id, "refund_requested")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/schedule-deal")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> scheduleDeal(
            @PathVariable Long id,
            @RequestBody AppointmentRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Da dat lich giao dich BDS",
                    transactionService.scheduleDeal(id, request.getScheduledAt())));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/broker-confirm")
    @PreAuthorize("hasRole('BROKER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> brokerConfirm(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Da xac nhan nguoi mua thanh toan cho nguoi ban",
                    transactionService.updateStatus(id, "broker_confirmed")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/broker-reject")
    @PreAuthorize("hasRole('BROKER')")
    public ResponseEntity<ApiResponse<TransactionDTO>> brokerReject(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Da xac nhan giao dich truc tiep that bai",
                    transactionService.rejectBrokerDeal(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/documents/{documentId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TransactionDTO>> verifyDocument(
            @PathVariable Long id, @PathVariable Long documentId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Đã xác thực tài liệu",
                    transactionService.verifyDocument(id, documentId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/documents/{documentId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TransactionDTO>> rejectDocument(
            @PathVariable Long id, @PathVariable Long documentId, @RequestParam String reason) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối tài liệu",
                    transactionService.rejectDocument(id, documentId, reason)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}

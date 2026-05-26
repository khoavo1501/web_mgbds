package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Long transactionId;
    private String transactionCode;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private BigDecimal remainingAmount;
    private BigDecimal commissionDeduction;
    private BigDecimal brokerCommissionAmount;
    private BigDecimal companyCommissionAmount;
    private BigDecimal refundableDeposit;
    private String paymentMethod;
    private Boolean depositConfirmed;
    private Boolean documentsSubmitted;
    private Boolean documentsVerified;
    private String customerIdentityStatus;
    private String status;
    private LocalDate transactionDate;
    private LocalDateTime dealScheduleAt;
    private LocalDateTime expiredAt;
    private LocalDateTime lockedAt;

    // Property info
    private Long propertyId;
    private String propertyTitle;
    private String propertyCode;
    private String propertyType;
    private String propertyProvince;
    private String propertyDistrict;
    private BigDecimal propertyArea;
    private BigDecimal propertyPrice;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerBankName;
    private String customerBankAccountNumber;
    private String customerBankAccountHolder;
    private String customerCccdFrontUrl;
    private String customerCccdBackUrl;
    private String customerResidenceUrl;
    private String customerIdentityRejectReason;

    // Broker info
    private Long brokerId;
    private String brokerName;
    private String brokerEmail;

    private Long appointmentId;
    private LocalDateTime appointmentScheduledAt;
    private String appointmentStatus;
    private String appointmentNote;

    private List<TransactionDocumentDTO> documents;
    private List<TransactionPaymentDTO> payments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionDocumentDTO {
        private Long documentId;
        private String documentType;
        private String fileName;
        private String url;
        private String status;
        private String rejectReason;
        private LocalDateTime uploadedAt;
        private LocalDateTime reviewedAt;
        private String reviewedByName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionPaymentDTO {
        private Long paymentId;
        private BigDecimal amount;
        private String paymentMethod;
        private String paymentStatus;
        private LocalDate paymentDate;
        private String confirmedByName;
    }
}

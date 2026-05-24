package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommissionDTO {
    private Long commissionId;
    private BigDecimal amount;
    private BigDecimal totalCommissionAmount;
    private BigDecimal brokerAmount;
    private BigDecimal companyAmount;
    private String status;

    // Transaction info
    private Long transactionId;
    private String transactionCode;
    private BigDecimal transactionTotalPrice;

    // Property info
    private String propertyTitle;

    // Customer info
    private String customerName;

    // Broker info
    private Long userId;
    private String userName;
}

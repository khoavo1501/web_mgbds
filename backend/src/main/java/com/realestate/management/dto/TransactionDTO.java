package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Long transactionId;
    private String transactionCode;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private String status;
    private LocalDate transactionDate;

    // Property info
    private Long propertyId;
    private String propertyTitle;
    private String propertyCode;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // Broker info
    private Long brokerId;
    private String brokerName;
    private String brokerEmail;
}

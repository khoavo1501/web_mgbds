package com.realestate.management.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionRequest {

    @NotNull(message = "Property ID không được để trống")
    private Long propertyId;

    @NotNull(message = "Customer ID không được để trống")
    private Long customerId;

    private Long appointmentId;

    @NotNull(message = "Tổng giá trị không được để trống")
    @DecimalMin(value = "0.01", message = "Tổng giá trị phải lớn hơn 0")
    private BigDecimal totalPrice;

    @DecimalMin(value = "0", message = "Tiền đặt cọc không được âm")
    private BigDecimal depositAmount = BigDecimal.ZERO;

    private String paymentMethod; // 'cash', 'transfer'

    private String note;
}

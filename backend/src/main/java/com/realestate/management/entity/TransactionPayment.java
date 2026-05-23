package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entity TransactionPayment - Thanh toán giao dịch
 * Payment Method: 'cash', 'transfer'
 */
@Entity
@Table(name = "transaction_payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod; // 'cash', 'transfer'

    @Column(name = "payment_status", length = 30)
    private String paymentStatus = "pending"; // 'pending', 'submitted', 'confirmed'

    @Column(name = "payment_date")
    private LocalDate paymentDate = LocalDate.now();

    // ===================================================================
    // Relationships
    // ===================================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    @JsonIgnore
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    @JsonIgnore
    private User confirmedBy;
}

package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity Transaction - Giao dịch
 * Status: 'pending', 'customer_confirmed', 'documents_submitted',
 * 'documents_verified', 'payment_submitted', 'deposit_confirmed',
 * 'commitment_signed', 'deal_scheduled', 'broker_confirmed', 'refund_requested', 'refunded',
 * 'completed', 'cancelled'
 */
@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 50)
    private String transactionCode;

    @Column(name = "total_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "deposit_amount", precision = 18, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "status", length = 30)
    private String status = "pending";

    @Column(name = "transaction_date")
    private LocalDate transactionDate = LocalDate.now();

    @Column(name = "deal_schedule_at")
    private LocalDateTime dealScheduleAt;

    // ===================================================================
    // Relationships
    // ===================================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    @JsonIgnore
    private User broker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    @JsonIgnore
    private Appointment appointment;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TransactionPayment> payments;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TransactionDocument> documents;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Contract> contracts;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Commission> commissions;
}

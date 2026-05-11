package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Entity Customer - Hồ sơ khách hàng mở rộng
 * Customer Type: 'buyer', 'seller'
 */
@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_type", length = 20)
    private String customerType; // 'buyer', 'seller'

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "budget_max", precision = 18, scale = 2)
    private BigDecimal budgetMax;

    // ===================================================================
    // Relationships
    // ===================================================================

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;
}

package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity Property - Bất động sản
 * Status: 'pending', 'published', 'in_transaction', 'sold', 'rejected'
 */
@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "property_id")
    private Long propertyId;

    @Column(name = "property_code", nullable = false, unique = true, length = 50)
    private String propertyCode; // Mã BDS tự động sinh (VD: BDS-2024-0001)

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "property_type", nullable = false, length = 50)
    private String propertyType; // 'apartment', 'house', 'land', 'villa'

    @Column(name = "status", length = 30)
    private String status = "pending"; // 'pending', 'published', 'in_transaction', 'sold', 'rejected'

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "province", nullable = false, length = 100)
    private String province;

    @Column(name = "district", nullable = false, length = 100)
    private String district;

    @Column(name = "area", nullable = false, precision = 10, scale = 2)
    private BigDecimal area; // Diện tích (m²)

    @Column(name = "price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price; // Giá (VNĐ)

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ===================================================================
    // Exclusive Brokerage Contract Details
    // ===================================================================

    @Column(name = "is_exclusive")
    private Boolean isExclusive = false;

    @Column(name = "contract_status", length = 30)
    private String contractStatus; // PENDING, ACTIVE, EXPIRED, TERMINATED, REJECTED

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(name = "owner_phone", length = 20)
    private String ownerPhone;

    @Column(name = "exclusive_duration", length = 100)
    private String exclusiveDuration;

    @Column(name = "brokerage_fee", precision = 5, scale = 2)
    private BigDecimal brokerageFee; // % fee

    @Column(name = "owner_desired_price", precision = 18, scale = 2)
    private BigDecimal ownerDesiredPrice;

    @Column(name = "commission_terms", columnDefinition = "TEXT")
    private String commissionTerms;

    @Column(name = "brokerage_contract_url", length = 500)
    private String brokerageContractUrl;

    @Column(name = "is_locked")
    private Boolean isLocked = false;

    // ===================================================================
    // Legal Document Details
    // ===================================================================

    @Column(name = "red_book_url", length = 500)
    private String redBookUrl;

    @Column(name = "household_registration_url", length = 500)
    private String householdRegistrationUrl;

    @Column(name = "owner_id_url", length = 500)
    private String ownerIdUrl;

    // ===================================================================
    // Relationships
    // ===================================================================

    /**
     * Người tạo BDS (broker/admin)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnore
    private User createdBy;

    /**
     * Người được gán phụ trách BDS (broker)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    @JsonIgnore
    private User assignedTo;

    /**
     * Danh sách hình ảnh của BDS
     */
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<PropertyImage> images;

    /**
     * Danh sách lịch hẹn xem BDS
     */
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Appointment> appointments;

    /**
     * Danh sách leads liên quan đến BDS này
     */
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Lead> leads;

    /**
     * Danh sách giao dịch liên quan đến BDS này
     */
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Transaction> transactions;

    // Constructor tiện ích
    public Property(String propertyCode, String title, String description, String propertyType,
                    String province, String district, BigDecimal area, BigDecimal price,
                    User createdBy, User assignedTo) {
        this.propertyCode = propertyCode;
        this.title = title;
        this.description = description;
        this.propertyType = propertyType;
        this.province = province;
        this.district = district;
        this.area = area;
        this.price = price;
        this.createdBy = createdBy;
        this.assignedTo = assignedTo;
        this.status = "pending";
    }
}

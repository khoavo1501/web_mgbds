package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity User - Quản lý người dùng hệ thống
 * Roles: admin, broker, customer
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    @JsonIgnore // Không trả về password trong JSON response
    private String passwordHash;

    @Column(name = "role", nullable = false, length = 20)
    private String role; // 'admin', 'broker', 'customer'

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_account_holder", length = 255)
    private String bankAccountHolder;

    @Column(name = "identity_verification_status", length = 30)
    private String identityVerificationStatus = "not_submitted";

    @Column(name = "cccd_front_url", length = 500)
    private String cccdFrontUrl;

    @Column(name = "cccd_back_url", length = 500)
    private String cccdBackUrl;

    @Column(name = "residence_url", length = 500)
    private String residenceUrl;

    @Column(name = "identity_reject_reason", columnDefinition = "TEXT")
    private String identityRejectReason;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ===================================================================
    // Relationships
    // ===================================================================

    /**
     * Danh sách BDS được tạo bởi user này (broker/admin)
     * mappedBy = "createdBy" tương ứng với field createdBy trong Property
     */
    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // Tránh vòng lặp vô hạn khi serialize
    private List<Property> createdProperties;

    /**
     * Danh sách BDS được gán cho user này (broker)
     */
    @OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Property> assignedProperties;

    /**
     * Danh sách lịch hẹn của user (customer hoặc broker)
     */
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Appointment> customerAppointments;

    @OneToMany(mappedBy = "broker", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Appointment> brokerAppointments;

    /**
     * Danh sách thông báo của user
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Notification> notifications;

    // Constructor tiện ích (không bao gồm relationships)
    public User(String email, String passwordHash, String role, String fullName, String phone) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.fullName = fullName;
        this.phone = phone;
        this.isActive = true;
    }
}

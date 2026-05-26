package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity Appointment - Lịch hẹn xem BDS
 * Status: 'scheduled', 'completed', 'cancelled'
 */
@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "status", length = 30)
    private String status = "scheduled"; // 'scheduled', 'completed', 'cancelled'

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

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
}

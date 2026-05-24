package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity AuditLog - Nhật ký hệ thống (Immutable)
 */
@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id", updatable = false)
    private Long auditId;

    @Column(name = "before_status", length = 50, updatable = false)
    private String beforeStatus;

    @Column(name = "after_status", length = 50, updatable = false)
    private String afterStatus;

    @Column(name = "action", nullable = false, length = 100, updatable = false)
    private String action;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Column(name = "actor_role", length = 50, updatable = false)
    private String actorRole;

    @Column(name = "entity_type", nullable = false, length = 50, updatable = false)
    private String entityType; // Transaction, Property, Document

    @Column(name = "entity_id", nullable = false, updatable = false)
    private Long entityId;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;
}

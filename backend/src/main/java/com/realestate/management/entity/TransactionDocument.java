package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    @JsonIgnore
    private Transaction transaction;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // CCCD, Hộ khẩu, Biên lai, Hợp đồng cọc...

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    // TODO: Drop this legacy column from database. Added to bypass NOT NULL constraint.
    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "status", length = 30)
    private String status = "pending_review"; // pending_review, verified, rejected

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    @JsonIgnore
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    @JsonIgnore
    private User uploadedBy;

    @Column(name = "version")
    private Integer version = 1;
}

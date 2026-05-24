package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "property_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private Property property;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // CCCD, Hợp đồng môi giới, Sổ đỏ...

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "status", length = 30)
    private String status = "pending_review"; // pending_review, verified, rejected

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    @JsonIgnore
    private User uploadedBy;
}

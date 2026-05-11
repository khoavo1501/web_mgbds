package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity PropertyImage - Hình ảnh BDS
 */
@Entity
@Table(name = "property_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Long imageId;

    @Column(name = "url", nullable = false, length = 500)
    private String url; // URL hoặc đường dẫn file ảnh

    @Column(name = "is_primary")
    private Boolean isPrimary = false; // Ảnh đại diện chính

    // ===================================================================
    // Relationships
    // ===================================================================

    /**
     * BDS mà ảnh này thuộc về
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore // Tránh vòng lặp vô hạn khi serialize
    private Property property;

    // Constructor tiện ích
    public PropertyImage(String url, Boolean isPrimary, Property property) {
        this.url = url;
        this.isPrimary = isPrimary;
        this.property = property;
    }
}

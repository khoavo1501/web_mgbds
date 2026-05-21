package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho Notification
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long notificationId;
    private String title;
    private String message;  // Map từ content
    private String type;     // Có thể thêm type để frontend hiển thị icon
    private Boolean isRead;
    private LocalDateTime createdAt;
}

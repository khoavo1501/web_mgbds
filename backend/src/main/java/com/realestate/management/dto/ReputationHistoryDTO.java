package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReputationHistoryDTO {
    private Long historyId;
    private String actionType;
    private Integer pointsChange;
    private Integer previousScore;
    private Integer newScore;
    private String reason;
    private Long appointmentId;
    private LocalDateTime createdAt;
    private String createdByName; // Tên admin nếu là điều chỉnh thủ công
}

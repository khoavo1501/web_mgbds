package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReputationScoreDTO {
    private Integer currentScore;
    private String level; // 'excellent', 'good', 'average', 'low', 'very_low', 'violation'
    private String levelName; // 'Xuất sắc', 'Tốt', 'Trung bình', 'Thấp', 'Rất thấp', 'Vi phạm'
    private String levelColor; // 'green', 'blue', 'yellow', 'orange', 'red', 'black'
    private Integer maxAppointments; // Số lịch hẹn tối đa được đặt cùng lúc
    private Boolean canBookAppointment; // Có thể đặt lịch không
    private String restrictionMessage; // Thông báo hạn chế (nếu có)
}

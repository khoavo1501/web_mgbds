package com.realestate.management.service;

import com.realestate.management.dto.ReputationHistoryDTO;
import com.realestate.management.dto.ReputationScoreDTO;
import com.realestate.management.entity.Appointment;
import com.realestate.management.entity.ReputationHistory;
import com.realestate.management.entity.User;
import com.realestate.management.repository.AppointmentRepository;
import com.realestate.management.repository.ReputationHistoryRepository;
import com.realestate.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReputationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReputationHistoryRepository reputationHistoryRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // Action types
    public static final String ACTION_CANCEL_CONFIRMED_WITHIN_24H = "cancel_confirmed_within_24h";
    public static final String ACTION_CANCEL_CONFIRMED_AFTER_24H = "cancel_confirmed_after_24h";
    public static final String ACTION_COMPLETE_APPOINTMENT = "complete_appointment";
    public static final String ACTION_NO_SHOW = "no_show";
    public static final String ACTION_MANUAL_ADJUSTMENT = "manual_adjustment";

    // Points
    public static final int POINTS_CANCEL_WITHIN_24H = -20;
    public static final int POINTS_CANCEL_AFTER_24H = -10;
    public static final int POINTS_RESCHEDULE_CONFIRMED_AFTER_24H = -5; // Dời lịch còn > 24h
    public static final int POINTS_RESCHEDULE_CONFIRMED_WITHIN_24H = -10; // Dời lịch còn < 24h
    public static final int POINTS_COMPLETE = 5;
    public static final int POINTS_NO_SHOW = -30;

    /**
     * Xử lý điểm khi hủy lịch hẹn
     */
    @Transactional
    public void handleCancelAppointment(Appointment appointment, String cancelReason) {
        User customer = appointment.getCustomer();
        
        // Chỉ xử lý nếu lịch hẹn đã được confirmed
        if (!isConfirmedStatus(appointment.getStatus())) {
            return; // Không trừ điểm nếu chưa confirmed
        }

        // Tính thời gian còn lại đến lịch hẹn
        long hoursUntil = Duration.between(LocalDateTime.now(), appointment.getScheduledAt()).toHours();
        
        String actionType;
        int pointsChange;
        String reason;

        if (hoursUntil < 24) {
            // Hủy trong vòng 24h
            actionType = ACTION_CANCEL_CONFIRMED_WITHIN_24H;
            pointsChange = POINTS_CANCEL_WITHIN_24H;
            reason = String.format("Hủy lịch hẹn đã xác nhận trong vòng 24h (còn %d giờ). Lý do: %s", 
                hoursUntil, cancelReason != null ? cancelReason : "Không có lý do");
        } else {
            // Hủy trước 24h
            actionType = ACTION_CANCEL_CONFIRMED_AFTER_24H;
            pointsChange = POINTS_CANCEL_AFTER_24H;
            reason = String.format("Hủy lịch hẹn đã xác nhận (còn %d giờ). Lý do: %s", 
                hoursUntil, cancelReason != null ? cancelReason : "Không có lý do");
        }

        changePoints(customer, actionType, pointsChange, reason, appointment, null);
    }

    /**
     * Xử lý điểm khi dời lịch hẹn đã confirmed
     */
    @Transactional
    public void handleRescheduleAppointment(Appointment appointment, String rescheduleReason) {
        User customer = appointment.getCustomer();
        
        // Tính thời gian còn lại đến lịch hẹn
        long hoursUntil = Duration.between(LocalDateTime.now(), appointment.getScheduledAt()).toHours();
        
        String actionType;
        int pointsChange;
        String reason;

        if (hoursUntil < 24) {
            // Dời lịch trong vòng 24h - Trừ điểm nhiều hơn
            actionType = "reschedule_confirmed_within_24h";
            pointsChange = POINTS_RESCHEDULE_CONFIRMED_WITHIN_24H;
            reason = String.format("Dời lịch hẹn đã xác nhận trong vòng 24h (còn %d giờ). Lý do: %s", 
                hoursUntil, rescheduleReason != null ? rescheduleReason : "Không có lý do");
        } else {
            // Dời lịch trước 24h - Trừ điểm ít hơn
            actionType = "reschedule_confirmed_after_24h";
            pointsChange = POINTS_RESCHEDULE_CONFIRMED_AFTER_24H;
            reason = String.format("Dời lịch hẹn đã xác nhận (còn %d giờ). Lý do: %s", 
                hoursUntil, rescheduleReason != null ? rescheduleReason : "Không có lý do");
        }
        
        changePoints(customer, actionType, pointsChange, reason, appointment, null);
    }

    /**
     * Xử lý điểm khi hoàn thành lịch hẹn
     */
    @Transactional
    public void handleCompleteAppointment(Appointment appointment) {
        User customer = appointment.getCustomer();
        
        String reason = String.format("Hoàn thành lịch hẹn xem BĐS #%d đúng giờ", 
            appointment.getProperty().getPropertyId());
        
        changePoints(customer, ACTION_COMPLETE_APPOINTMENT, POINTS_COMPLETE, reason, appointment, null);
    }

    /**
     * Xử lý điểm khi khách không đến (no-show)
     */
    @Transactional
    public void handleNoShow(Appointment appointment, String brokerNote) {
        User customer = appointment.getCustomer();
        
        String reason = String.format("Không đến lịch hẹn. Ghi chú từ môi giới: %s", 
            brokerNote != null ? brokerNote : "Khách không đến và không báo trước");
        
        changePoints(customer, ACTION_NO_SHOW, POINTS_NO_SHOW, reason, appointment, null);
    }

    /**
     * Thay đổi điểm uy tín
     */
    @Transactional
    public void changePoints(User user, String actionType, int pointsChange, String reason, 
                            Appointment appointment, User createdBy) {
        int previousScore = user.getReputationScore() != null ? user.getReputationScore() : 100;
        int newScore = previousScore + pointsChange;
        
        // Cập nhật điểm cho user
        user.setReputationScore(newScore);
        userRepository.save(user);
        
        // Lưu lịch sử
        ReputationHistory history = new ReputationHistory();
        history.setUser(user);
        history.setActionType(actionType);
        history.setPointsChange(pointsChange);
        history.setPreviousScore(previousScore);
        history.setNewScore(newScore);
        history.setReason(reason);
        history.setAppointment(appointment);
        history.setCreatedBy(createdBy);
        
        reputationHistoryRepository.save(history);
    }

    /**
     * Lấy thông tin điểm uy tín của user hiện tại
     */
    public ReputationScoreDTO getMyReputationScore() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return getReputationScoreDTO(user);
    }

    /**
     * Lấy thông tin điểm uy tín của user
     */
    public ReputationScoreDTO getReputationScoreDTO(User user) {
        int score = user.getReputationScore() != null ? user.getReputationScore() : 100;
        
        ReputationScoreDTO dto = new ReputationScoreDTO();
        dto.setCurrentScore(score);
        
        if (score >= 80) {
            dto.setLevel("excellent");
            dto.setLevelName("Xuất sắc");
            dto.setLevelColor("green");
            dto.setMaxAppointments(999);
            dto.setCanBookAppointment(true);
            dto.setRestrictionMessage(null);
        } else if (score >= 60) {
            dto.setLevel("good");
            dto.setLevelName("Tốt");
            dto.setLevelColor("blue");
            dto.setMaxAppointments(999);
            dto.setCanBookAppointment(true);
            dto.setRestrictionMessage(null);
        } else if (score >= 40) {
            dto.setLevel("average");
            dto.setLevelName("Trung bình");
            dto.setLevelColor("yellow");
            dto.setMaxAppointments(2);
            dto.setCanBookAppointment(true);
            dto.setRestrictionMessage("Bạn chỉ có thể đặt tối đa 2 lịch hẹn cùng lúc");
        } else if (score >= 20) {
            dto.setLevel("low");
            dto.setLevelName("Thấp");
            dto.setLevelColor("orange");
            dto.setMaxAppointments(1);
            dto.setCanBookAppointment(true);
            dto.setRestrictionMessage("Bạn chỉ có thể đặt tối đa 1 lịch hẹn. Vui lòng cải thiện điểm uy tín");
        } else if (score >= 0) {
            dto.setLevel("very_low");
            dto.setLevelName("Rất thấp");
            dto.setLevelColor("red");
            dto.setMaxAppointments(0);
            dto.setCanBookAppointment(false);
            dto.setRestrictionMessage("Tài khoản bị tạm khóa tính năng đặt lịch do điểm uy tín quá thấp");
        } else {
            dto.setLevel("violation");
            dto.setLevelName("Vi phạm");
            dto.setLevelColor("black");
            dto.setMaxAppointments(0);
            dto.setCanBookAppointment(false);
            dto.setRestrictionMessage("Tài khoản bị khóa vĩnh viễn. Vui lòng liên hệ admin");
        }
        
        return dto;
    }

    /**
     * Kiểm tra xem user có thể đặt lịch không
     */
    public boolean canBookAppointment(User user) {
        ReputationScoreDTO scoreDTO = getReputationScoreDTO(user);
        
        if (!scoreDTO.getCanBookAppointment()) {
            return false;
        }
        
        // Kiểm tra số lịch hẹn đang active
        long activeAppointments = appointmentRepository.findByCustomer(user).stream()
            .filter(apt -> "pending".equalsIgnoreCase(apt.getStatus()) ||
                          "confirmed".equalsIgnoreCase(apt.getStatus()) ||
                          "scheduled".equalsIgnoreCase(apt.getStatus()) ||
                          "viewed".equalsIgnoreCase(apt.getStatus()))
            .count();
        
        return activeAppointments < scoreDTO.getMaxAppointments();
    }

    /**
     * Lấy lịch sử thay đổi điểm
     */
    public List<ReputationHistoryDTO> getMyReputationHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return reputationHistoryRepository.findByUserOrderByCreatedAtDesc(user).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Lấy 10 lịch sử gần nhất
     */
    public List<ReputationHistoryDTO> getRecentHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return reputationHistoryRepository.findTop10ByUserOrderByCreatedAtDesc(user).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private ReputationHistoryDTO convertToDTO(ReputationHistory history) {
        ReputationHistoryDTO dto = new ReputationHistoryDTO();
        dto.setHistoryId(history.getHistoryId());
        dto.setActionType(history.getActionType());
        dto.setPointsChange(history.getPointsChange());
        dto.setPreviousScore(history.getPreviousScore());
        dto.setNewScore(history.getNewScore());
        dto.setReason(history.getReason());
        dto.setAppointmentId(history.getAppointment() != null ? history.getAppointment().getAppointmentId() : null);
        dto.setCreatedAt(history.getCreatedAt());
        dto.setCreatedByName(history.getCreatedBy() != null ? history.getCreatedBy().getFullName() : null);
        return dto;
    }

    private boolean isConfirmedStatus(String status) {
        return "confirmed".equalsIgnoreCase(status) ||
               "scheduled".equalsIgnoreCase(status) ||
               "viewed".equalsIgnoreCase(status);
    }
}

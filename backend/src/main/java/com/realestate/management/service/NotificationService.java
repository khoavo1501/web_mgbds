package com.realestate.management.service;

import com.realestate.management.entity.Appointment;
import com.realestate.management.entity.Notification;
import com.realestate.management.entity.User;
import com.realestate.management.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FIX LỖI 7: Service gửi thông báo cho broker/customer
 * FIX LỖI 10: Tích hợp gửi email
 */
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Gửi thông báo khi có lịch hẹn mới cho broker
     */
    @Transactional
    public void notifyBrokerNewAppointment(Appointment appointment) {
        try {
            // Tạo notification trong hệ thống
            Notification notification = new Notification();
            notification.setUser(appointment.getBroker());
            notification.setTitle("🔔 Lịch hẹn mới!");
            notification.setContent(String.format(
                "Bạn có lịch hẹn mới từ khách hàng %s cho BĐS '%s' vào lúc %s. Vui lòng xác nhận hoặc từ chối.",
                appointment.getCustomer().getFullName(),
                appointment.getProperty().getTitle(),
                formatDateTime(appointment.getScheduledAt())
            ));
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // FIX LỖI 10: Gửi email (tạm thời tắt)
            // emailService.sendNewAppointmentEmailToBroker(appointment);
        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi thông báo khi broker xác nhận lịch hẹn
     */
    @Transactional
    public void notifyCustomerAppointmentConfirmed(Appointment appointment) {
        try {
            // Tạo notification trong hệ thống
            Notification notification = new Notification();
            notification.setUser(appointment.getCustomer());
            notification.setTitle("✅ Lịch hẹn đã được xác nhận!");
            notification.setContent(String.format(
                "Lịch hẹn xem BĐS '%s' vào lúc %s đã được broker %s xác nhận. Hẹn gặp bạn!",
                appointment.getProperty().getTitle(),
                formatDateTime(appointment.getScheduledAt()),
                appointment.getBroker().getFullName()
            ));
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // FIX LỖI 10: Gửi email (tạm thời tắt để debug)
            // emailService.sendAppointmentConfirmedEmailToCustomer(appointment);
        } catch (Exception e) {
            // Log error nhưng không throw để không block confirm
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi thông báo khi broker từ chối lịch hẹn
     */
    @Transactional
    public void notifyCustomerAppointmentRejected(Appointment appointment) {
        try {
            // Tạo notification trong hệ thống
            Notification notification = new Notification();
            notification.setUser(appointment.getCustomer());
            notification.setTitle("❌ Lịch hẹn bị từ chối");
            notification.setContent(String.format(
                "Lịch hẹn xem BĐS '%s' vào lúc %s đã bị từ chối. Lý do: %s",
                appointment.getProperty().getTitle(),
                formatDateTime(appointment.getScheduledAt()),
                appointment.getCancellationReason() != null ? appointment.getCancellationReason() : "Không có lý do"
            ));
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // FIX LỖI 10: Gửi email (tạm thời tắt)
            // emailService.sendAppointmentRejectedEmailToCustomer(appointment);
        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi thông báo khi lịch hẹn hoàn tất
     */
    @Transactional
    public void notifyCustomerAppointmentCompleted(Appointment appointment) {
        try {
            // Tạo notification trong hệ thống
            Notification notification = new Notification();
            notification.setUser(appointment.getCustomer());
            notification.setTitle("🎉 Lịch hẹn đã hoàn tất!");
            notification.setContent(String.format(
                "Lịch hẹn xem BĐS '%s' đã hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!",
                appointment.getProperty().getTitle()
            ));
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // FIX LỖI 10: Gửi email (tạm thời tắt)
            // emailService.sendAppointmentCompletedEmailToCustomer(appointment);
        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi thông báo khi khách hàng hủy lịch hẹn
     */
    @Transactional
    public void notifyBrokerAppointmentCancelled(Appointment appointment) {
        try {
            // Tạo notification trong hệ thống
            Notification notification = new Notification();
            notification.setUser(appointment.getBroker());
            notification.setTitle("⚠️ Lịch hẹn bị hủy");
            notification.setContent(String.format(
                "Khách hàng %s đã hủy lịch hẹn xem BĐS '%s' vào lúc %s. Lý do: %s",
                appointment.getCustomer().getFullName(),
                appointment.getProperty().getTitle(),
                formatDateTime(appointment.getScheduledAt()),
                appointment.getCancellationReason() != null ? appointment.getCancellationReason() : "Không có lý do"
            ));
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // FIX LỖI 10: Gửi email (tạm thời tắt)
            // emailService.sendAppointmentCancelledEmailToBroker(appointment);
        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Gửi thông báo khi khách hàng dời lịch
     */
    @Transactional
    public void notifyBrokerAppointmentRescheduled(Appointment appointment) {
        try {
            // Tạo notification trong hệ thống
            Notification notification = new Notification();
            notification.setUser(appointment.getBroker());
            notification.setTitle("🔄 Lịch hẹn được dời");
            notification.setContent(String.format(
                "Khách hàng %s đã dời lịch hẹn xem BĐS '%s' sang thời gian mới: %s. Vui lòng xác nhận lại.",
                appointment.getCustomer().getFullName(),
                appointment.getProperty().getTitle(),
                formatDateTime(appointment.getScheduledAt())
            ));
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // FIX LỖI 10: Gửi email (tạm thời tắt)
            // emailService.sendAppointmentRescheduledEmailToBroker(appointment);
        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Format datetime cho dễ đọc
     */
    private String formatDateTime(java.time.LocalDateTime dateTime) {
        java.time.format.DateTimeFormatter formatter = 
            java.time.format.DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");
        return dateTime.format(formatter);
    }
}

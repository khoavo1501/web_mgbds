package com.realestate.management.service;

import com.realestate.management.entity.Appointment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * FIX LỖI 10: Service gửi email thông báo
 */
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.email.from:noreply@realestate.com}")
    private String fromEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");

    /**
     * Gửi email khi có lịch hẹn mới cho broker
     */
    @Async
    public void sendNewAppointmentEmailToBroker(Appointment appointment) {
        if (!emailEnabled) {
            System.out.println("📧 [EMAIL DISABLED] Would send: New appointment to broker " + 
                appointment.getBroker().getEmail());
            return;
        }

        try {
            String subject = "🔔 Lịch hẹn mới từ khách hàng";
            String content = buildNewAppointmentEmailForBroker(appointment);
            
            sendHtmlEmail(appointment.getBroker().getEmail(), subject, content);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi broker xác nhận lịch hẹn
     */
    @Async
    public void sendAppointmentConfirmedEmailToCustomer(Appointment appointment) {
        if (!emailEnabled) {
            System.out.println("📧 [EMAIL DISABLED] Would send: Appointment confirmed to customer " + 
                appointment.getCustomer().getEmail());
            return;
        }

        try {
            String subject = "✅ Lịch hẹn của bạn đã được xác nhận";
            String content = buildAppointmentConfirmedEmail(appointment);
            
            sendHtmlEmail(appointment.getCustomer().getEmail(), subject, content);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi broker từ chối lịch hẹn
     */
    @Async
    public void sendAppointmentRejectedEmailToCustomer(Appointment appointment) {
        if (!emailEnabled) {
            System.out.println("📧 [EMAIL DISABLED] Would send: Appointment rejected to customer " + 
                appointment.getCustomer().getEmail());
            return;
        }

        try {
            String subject = "❌ Lịch hẹn của bạn bị từ chối";
            String content = buildAppointmentRejectedEmail(appointment);
            
            sendHtmlEmail(appointment.getCustomer().getEmail(), subject, content);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi lịch hẹn hoàn tất
     */
    @Async
    public void sendAppointmentCompletedEmailToCustomer(Appointment appointment) {
        if (!emailEnabled) {
            System.out.println("📧 [EMAIL DISABLED] Would send: Appointment completed to customer " + 
                appointment.getCustomer().getEmail());
            return;
        }

        try {
            String subject = "🎉 Lịch hẹn đã hoàn tất";
            String content = buildAppointmentCompletedEmail(appointment);
            
            sendHtmlEmail(appointment.getCustomer().getEmail(), subject, content);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi khách hàng hủy lịch hẹn
     */
    @Async
    public void sendAppointmentCancelledEmailToBroker(Appointment appointment) {
        if (!emailEnabled) {
            System.out.println("📧 [EMAIL DISABLED] Would send: Appointment cancelled to broker " + 
                appointment.getBroker().getEmail());
            return;
        }

        try {
            String subject = "⚠️ Khách hàng đã hủy lịch hẹn";
            String content = buildAppointmentCancelledEmail(appointment);
            
            sendHtmlEmail(appointment.getBroker().getEmail(), subject, content);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi khách hàng dời lịch
     */
    @Async
    public void sendAppointmentRescheduledEmailToBroker(Appointment appointment) {
        if (!emailEnabled) {
            System.out.println("📧 [EMAIL DISABLED] Would send: Appointment rescheduled to broker " + 
                appointment.getBroker().getEmail());
            return;
        }

        try {
            String subject = "🔄 Khách hàng đã dời lịch hẹn";
            String content = buildAppointmentRescheduledEmail(appointment);
            
            sendHtmlEmail(appointment.getBroker().getEmail(), subject, content);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
        System.out.println("✅ Email sent to: " + to);
    }

    // ========================================================================
    // HTML Email Templates
    // ========================================================================

    private String buildNewAppointmentEmailForBroker(Appointment appointment) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                    .info-row { margin: 10px 0; }
                    .label { font-weight: bold; color: #555; }
                    .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; 
                              display: inline-block; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔔 Lịch hẹn mới!</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Bạn có lịch hẹn mới từ khách hàng:</p>
                        
                        <div class="info-row">
                            <span class="label">👤 Khách hàng:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📞 Số điện thoại:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📧 Email:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">🏠 Bất động sản:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📅 Thời gian:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📝 Ghi chú:</span> %s
                        </div>
                        
                        <p style="margin-top: 20px;">
                            Vui lòng đăng nhập vào hệ thống để xác nhận hoặc từ chối lịch hẹn này.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động từ Hệ thống Quản lý Bất động sản</p>
                        <p>© 2026 Real Estate Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appointment.getBroker().getFullName(),
            appointment.getCustomer().getFullName(),
            appointment.getCustomer().getPhone(),
            appointment.getCustomer().getEmail(),
            appointment.getProperty().getTitle(),
            appointment.getScheduledAt().format(DATE_FORMATTER),
            appointment.getNote() != null ? appointment.getNote() : "Không có"
        );
    }

    private String buildAppointmentConfirmedEmail(Appointment appointment) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                    .info-row { margin: 10px 0; }
                    .label { font-weight: bold; color: #555; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>✅ Lịch hẹn đã được xác nhận!</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Lịch hẹn xem bất động sản của bạn đã được xác nhận:</p>
                        
                        <div class="info-row">
                            <span class="label">🏠 Bất động sản:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📅 Thời gian:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">👨‍💼 Môi giới:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📞 SĐT môi giới:</span> %s
                        </div>
                        
                        <p style="margin-top: 20px; color: #4CAF50; font-weight: bold;">
                            Hẹn gặp bạn vào thời gian trên!
                        </p>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động từ Hệ thống Quản lý Bất động sản</p>
                        <p>© 2026 Real Estate Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appointment.getCustomer().getFullName(),
            appointment.getProperty().getTitle(),
            appointment.getScheduledAt().format(DATE_FORMATTER),
            appointment.getBroker().getFullName(),
            appointment.getBroker().getPhone()
        );
    }

    private String buildAppointmentRejectedEmail(Appointment appointment) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f44336; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                    .info-row { margin: 10px 0; }
                    .label { font-weight: bold; color: #555; }
                    .reason { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>❌ Lịch hẹn bị từ chối</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Rất tiếc, lịch hẹn xem bất động sản của bạn đã bị từ chối:</p>
                        
                        <div class="info-row">
                            <span class="label">🏠 Bất động sản:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📅 Thời gian:</span> %s
                        </div>
                        
                        <div class="reason">
                            <strong>Lý do:</strong> %s
                        </div>
                        
                        <p style="margin-top: 20px;">
                            Bạn có thể đặt lịch hẹn khác với thời gian phù hợp hơn.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động từ Hệ thống Quản lý Bất động sản</p>
                        <p>© 2026 Real Estate Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appointment.getCustomer().getFullName(),
            appointment.getProperty().getTitle(),
            appointment.getScheduledAt().format(DATE_FORMATTER),
            appointment.getNote() != null ? appointment.getNote() : "Không có lý do"
        );
    }

    private String buildAppointmentCompletedEmail(Appointment appointment) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎉 Lịch hẹn đã hoàn tất!</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Lịch hẹn xem bất động sản <strong>%s</strong> đã hoàn tất.</p>
                        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
                        <p style="margin-top: 20px;">
                            Nếu bạn quan tâm đến bất động sản này hoặc muốn xem thêm các BĐS khác, 
                            vui lòng liên hệ với môi giới <strong>%s</strong> qua số điện thoại <strong>%s</strong>.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động từ Hệ thống Quản lý Bất động sản</p>
                        <p>© 2026 Real Estate Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appointment.getCustomer().getFullName(),
            appointment.getProperty().getTitle(),
            appointment.getBroker().getFullName(),
            appointment.getBroker().getPhone()
        );
    }

    private String buildAppointmentCancelledEmail(Appointment appointment) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                    .info-row { margin: 10px 0; }
                    .label { font-weight: bold; color: #555; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>⚠️ Khách hàng đã hủy lịch hẹn</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Khách hàng <strong>%s</strong> đã hủy lịch hẹn:</p>
                        
                        <div class="info-row">
                            <span class="label">🏠 Bất động sản:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📅 Thời gian:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📝 Lý do:</span> %s
                        </div>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động từ Hệ thống Quản lý Bất động sản</p>
                        <p>© 2026 Real Estate Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appointment.getBroker().getFullName(),
            appointment.getCustomer().getFullName(),
            appointment.getProperty().getTitle(),
            appointment.getScheduledAt().format(DATE_FORMATTER),
            appointment.getNote() != null ? appointment.getNote() : "Không có lý do"
        );
    }

    private String buildAppointmentRescheduledEmail(Appointment appointment) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                    .info-row { margin: 10px 0; }
                    .label { font-weight: bold; color: #555; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔄 Khách hàng đã dời lịch hẹn</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Khách hàng <strong>%s</strong> đã dời lịch hẹn sang thời gian mới:</p>
                        
                        <div class="info-row">
                            <span class="label">🏠 Bất động sản:</span> %s
                        </div>
                        <div class="info-row">
                            <span class="label">📅 Thời gian mới:</span> <strong style="color: #9C27B0;">%s</strong>
                        </div>
                        
                        <p style="margin-top: 20px;">
                            Vui lòng đăng nhập vào hệ thống để xác nhận lại lịch hẹn mới.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động từ Hệ thống Quản lý Bất động sản</p>
                        <p>© 2026 Real Estate Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            appointment.getBroker().getFullName(),
            appointment.getCustomer().getFullName(),
            appointment.getProperty().getTitle(),
            appointment.getScheduledAt().format(DATE_FORMATTER)
        );
    }
}

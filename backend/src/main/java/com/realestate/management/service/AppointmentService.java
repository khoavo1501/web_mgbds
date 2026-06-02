package com.realestate.management.service;

import com.realestate.management.dto.AppointmentDTO;
import com.realestate.management.dto.AppointmentRequest;
import com.realestate.management.entity.Appointment;
import com.realestate.management.entity.Property;
import com.realestate.management.entity.User;
import com.realestate.management.repository.AppointmentRepository;
import com.realestate.management.repository.PropertyRepository;
import com.realestate.management.repository.UserRepository;
import com.realestate.management.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReputationService reputationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionService transactionService;

    public List<AppointmentDTO> getMyAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        List<Appointment> appointments;
        if ("customer".equalsIgnoreCase(currentUser.getRole())) {
            appointments = appointmentRepository.findByCustomer(currentUser);
        } else if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            appointments = appointmentRepository.findByBroker(currentUser);
        } else {
            appointments = appointmentRepository.findAll(); // admin can see all
        }

        return appointments.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public AppointmentDTO getAppointmentById(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check permission: only customer, broker of this appointment, or admin can view
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền xem lịch hẹn này");
        }

        return convertToDTO(appointment);
    }

    public List<AppointmentDTO> getPropertyAppointments(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        return appointmentRepository.findByProperty(property).stream()
                .filter(appointment -> !"cancelled".equalsIgnoreCase(appointment.getStatus()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public boolean canBookAppointment(Long propertyId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User customer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        // Kiểm tra xem customer đã có lịch hẹn chưa hoàn thành cho BĐS này chưa
        boolean hasActiveAppointmentForProperty = appointmentRepository.findByCustomer(customer).stream()
                .anyMatch(appointment ->
                        appointment.getProperty().getPropertyId().equals(propertyId) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        return !hasActiveAppointmentForProperty;
    }

    @Transactional
    public AppointmentDTO createAppointment(AppointmentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User customer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        // Validate scheduledAt is required for creating appointment
        if (request.getScheduledAt() == null) {
            throw new RuntimeException("Thời gian không được để trống");
        }

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        User broker = property.getAssignedTo();
        if (broker == null) {
            throw new RuntimeException("Bất động sản này hiện chưa có broker phụ trách.");
        }

        // VALIDATION 0: Kiểm tra điểm uy tín
        if (!reputationService.canBookAppointment(customer)) {
            throw new RuntimeException("Bạn không thể đặt lịch do điểm uy tín quá thấp hoặc đã đạt giới hạn số lịch hẹn.");
        }

        // VALIDATION 1: Kiểm tra xem customer đã có lịch hẹn chưa hoàn thành cho BĐS này chưa
        boolean hasActiveAppointmentForProperty = appointmentRepository.findByCustomer(customer).stream()
                .anyMatch(appointment ->
                        appointment.getProperty().getPropertyId().equals(property.getPropertyId()) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        if (hasActiveAppointmentForProperty) {
            throw new RuntimeException("Bạn đã có lịch hẹn chưa hoàn thành cho bất động sản này. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt lịch mới.");
        }

        // 🆕 VALIDATION 1.5: Kiểm tra xem customer có giao dịch pending_deposit chưa hết hạn cho BĐS này không
        boolean hasPendingDepositTransaction = transactionRepository.findByProperty(property).stream()
                .anyMatch(transaction ->
                        transaction.getCustomer().getUserId().equals(customer.getUserId()) &&
                        "pending_deposit".equalsIgnoreCase(transaction.getStatus()) &&
                        transaction.getExpiredAt() != null &&
                        transaction.getExpiredAt().isAfter(java.time.LocalDateTime.now())
                );

        if (hasPendingDepositTransaction) {
            throw new RuntimeException("Bạn đã xem BĐS này và có giao dịch đang chờ đặt cọc. Vui lòng hoàn tất đặt cọc hoặc đợi giao dịch hết hạn (24h) trước khi đặt lịch xem lại.");
        }

        // VALIDATION 2: Kiểm tra xem customer đã đặt lịch trùng giờ ở BĐS khác chưa
        boolean hasConflictingAppointment = appointmentRepository.findByCustomer(customer).stream()
                .anyMatch(appointment ->
                        request.getScheduledAt().equals(appointment.getScheduledAt()) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        if (hasConflictingAppointment) {
            throw new RuntimeException("Bạn đã có lịch hẹn khác vào thời gian này. Vui lòng chọn thời gian khác hoặc hủy lịch hẹn cũ.");
        }

        // VALIDATION 3: Kiểm tra xem khung giờ này đã có người khác đặt chưa
        boolean alreadyBooked = appointmentRepository.findByProperty(property).stream()
                .anyMatch(appointment ->
                        request.getScheduledAt().equals(appointment.getScheduledAt()) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        if (alreadyBooked) {
            throw new RuntimeException("Khung giờ này đã có người đặt. Vui lòng chọn thời gian khác.");
        }

        Appointment appointment = new Appointment();
        appointment.setProperty(property);
        appointment.setCustomer(customer);
        appointment.setBroker(broker);
        appointment.setScheduledAt(request.getScheduledAt());
        appointment.setNote(request.getNote());
        appointment.setStatus("pending");
        appointment.setAppointmentType("property_viewing");

        appointment = appointmentRepository.save(appointment);
        
        // Gửi thông báo cho môi giới khi có lịch đặt mới
        String formattedTime = request.getScheduledAt().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"));
        notificationService.createNotification(
            broker,
            "appointment_created",
            "Lịch hẹn xem nhà mới",
            String.format("Khách hàng %s đã đặt lịch xem '%s' vào %s. Vui lòng kiểm tra và xác nhận.",
                customer.getFullName(),
                property.getTitle(),
                formattedTime
            ),
            "broker"
        );

        return convertToDTO(appointment);
    }

    @Transactional
    public AppointmentDTO updateAppointment(Long id, AppointmentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Log for debugging
        System.out.println("=== UPDATE APPOINTMENT DEBUG ===");
        System.out.println("Current User ID: " + currentUser.getUserId());
        System.out.println("Current User Email: " + currentUser.getEmail());
        System.out.println("Current User Role: " + currentUser.getRole());
        System.out.println("Appointment Customer ID: " + appointment.getCustomer().getUserId());
        System.out.println("Appointment Broker ID: " + appointment.getBroker().getUserId());
        System.out.println("Request Status: " + request.getStatus());
        System.out.println("Request ScheduledAt: " + request.getScheduledAt());
        System.out.println("================================");

        // Only customer or broker of this appointment or admin can update
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            System.out.println("PERMISSION DENIED: User " + currentUser.getUserId() + " cannot update appointment " + id);
            throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
        }

        // Update status first (if provided)
        String oldStatus = appointment.getStatus();
        if (request.getStatus() != null) {
            
            // 🆕 VALIDATION: Chỉ môi giới mới có quyền xác nhận (confirmed, completed) hoặc từ chối (rejected) lịch hẹn
            if (("confirmed".equalsIgnoreCase(request.getStatus()) || 
                 "viewed".equalsIgnoreCase(request.getStatus()) ||
                 "completed".equalsIgnoreCase(request.getStatus()) ||
                 "rejected".equalsIgnoreCase(request.getStatus())) && 
                !"broker".equalsIgnoreCase(currentUser.getRole()) &&
                !"admin".equalsIgnoreCase(currentUser.getRole())) {
                throw new RuntimeException("Chỉ môi giới mới có quyền xác nhận hoặc từ chối lịch hẹn");
            }
            
            // 🆕 VALIDATION: Môi giới chỉ được xác nhận "completed" SAU NGÀY hẹn
            if (("viewed".equalsIgnoreCase(request.getStatus()) || "completed".equalsIgnoreCase(request.getStatus())) &&
                "broker".equalsIgnoreCase(currentUser.getRole())) {
                
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.LocalDateTime scheduledTime = appointment.getScheduledAt();
                
                // Kiểm tra xem đã QUA NGÀY hẹn chưa (so sánh cả ngày và giờ)
                if (scheduledTime != null && now.toLocalDate().isBefore(scheduledTime.toLocalDate())) {
                    throw new RuntimeException(
                        String.format("Chưa đến ngày xem nhà! Lịch hẹn: %s. Bạn chỉ có thể xác nhận hoàn thành từ ngày %s trở đi.",
                            scheduledTime.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                            scheduledTime.toLocalDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        )
                    );
                }
            }
            
            appointment.setStatus(request.getStatus());

            // Gửi thông báo khi môi giới xác nhận/từ chối/hoàn thành
            if ("broker".equalsIgnoreCase(currentUser.getRole())) {
                String notifTitle = "";
                String notifMessage = "";
                String notifType = "";
                
                if ("confirmed".equalsIgnoreCase(request.getStatus()) || "scheduled".equalsIgnoreCase(request.getStatus())) {
                    notifTitle = "Lịch hẹn đã được xác nhận";
                    notifMessage = String.format("Môi giới %s đã xác nhận lịch hẹn xem '%s' của bạn.", 
                                        appointment.getBroker().getFullName(), appointment.getProperty().getTitle());
                    notifType = "appointment_confirmed";
                } else if ("rejected".equalsIgnoreCase(request.getStatus())) {
                    notifTitle = "Lịch hẹn bị từ chối";
                    notifMessage = String.format("Môi giới %s đã từ chối lịch hẹn xem '%s'.", 
                                        appointment.getBroker().getFullName(), appointment.getProperty().getTitle());
                    notifType = "appointment_rejected";
                } else if ("completed".equalsIgnoreCase(request.getStatus())) {
                    notifTitle = "Lịch hẹn hoàn tất";
                    notifMessage = String.format("Môi giới %s đã đánh dấu hoàn tất buổi xem '%s'.", 
                                        appointment.getBroker().getFullName(), appointment.getProperty().getTitle());
                    notifType = "appointment_completed";
                    
                    if (!"completed".equalsIgnoreCase(oldStatus)) {
                        transactionService.createTransactionFromCompletedAppointment(appointment);
                    }
                }
                
                if (!notifTitle.isEmpty()) {
                    notificationService.createNotification(
                        appointment.getCustomer(),
                        notifType,
                        notifTitle,
                        notifMessage,
                        "customer"
                    );
                }
            }
        }

        // Update note (if provided)
        if (request.getNote() != null) {
            appointment.setNote(request.getNote());
        }

        // Only run reschedule logic if scheduledAt is actually being changed
        if (request.getScheduledAt() != null && !request.getScheduledAt().equals(appointment.getScheduledAt())) {
            // Lưu trạng thái cũ để kiểm tra (sử dụng biến oldStatus đã khai báo ở trên)
            boolean isBrokerRescheduling = "broker".equalsIgnoreCase(currentUser.getRole());
            
            // VALIDATION: Kiểm tra xem customer có lịch hẹn trùng giờ ở BĐS khác không
            boolean hasConflictingAppointment = appointmentRepository.findByCustomer(appointment.getCustomer()).stream()
                    .anyMatch(apt ->
                            !apt.getAppointmentId().equals(id) && // Không tính lịch hẹn hiện tại
                            request.getScheduledAt().equals(apt.getScheduledAt()) &&
                            ("pending".equalsIgnoreCase(apt.getStatus()) ||
                             "confirmed".equalsIgnoreCase(apt.getStatus()) ||
                             "scheduled".equalsIgnoreCase(apt.getStatus()) ||
                             "viewed".equalsIgnoreCase(apt.getStatus()))
                    );

            if (hasConflictingAppointment) {
                throw new RuntimeException("Khách hàng đã có lịch hẹn khác vào thời gian này. Vui lòng chọn thời gian khác.");
            }

            // VALIDATION: Kiểm tra xem khung giờ mới đã có người khác đặt chưa
            boolean alreadyBooked = appointmentRepository.findByProperty(appointment.getProperty()).stream()
                    .anyMatch(apt ->
                            !apt.getAppointmentId().equals(id) && // Không tính lịch hẹn hiện tại
                            request.getScheduledAt().equals(apt.getScheduledAt()) &&
                            ("pending".equalsIgnoreCase(apt.getStatus()) ||
                             "confirmed".equalsIgnoreCase(apt.getStatus()) ||
                             "scheduled".equalsIgnoreCase(apt.getStatus()) ||
                             "viewed".equalsIgnoreCase(apt.getStatus()))
                    );

            if (alreadyBooked) {
                throw new RuntimeException("Khung giờ này đã có người đặt. Vui lòng chọn thời gian khác.");
            }

            // Xử lý điểm uy tín nếu là customer dời lịch đã confirmed
            if (appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
                ("confirmed".equalsIgnoreCase(oldStatus) || 
                 "scheduled".equalsIgnoreCase(oldStatus) || 
                 "viewed".equalsIgnoreCase(oldStatus))) {
                // Dời lịch đã confirmed cũng trừ điểm (nhưng ít hơn hủy)
                reputationService.handleRescheduleAppointment(appointment, request.getNote());
            }

            // Nếu môi giới dời lịch, gửi thông báo cho khách hàng
            if (isBrokerRescheduling) {
                String newDateTime = request.getScheduledAt().toString();
                String notificationMessage = String.format(
                    "Môi giới %s đã đề xuất dời lịch hẹn xem '%s' sang %s. Vui lòng xác nhận lại lịch hẹn mới.",
                    appointment.getBroker().getFullName(),
                    appointment.getProperty().getTitle(),
                    newDateTime
                );
                
                notificationService.createNotification(
                    appointment.getCustomer(),
                    "appointment_rescheduled",
                    "Lịch hẹn được đề xuất dời",
                    notificationMessage,
                    "customer"
                );
            }

            appointment.setScheduledAt(request.getScheduledAt());
            appointment.setStatus("pending"); // Reset to pending - customer needs to confirm
            
            // Nếu khách hàng dời lịch, gửi thông báo cho môi giới
            if (!isBrokerRescheduling) {
                String newDateTime = request.getScheduledAt().toString();
                String notificationMessage = String.format(
                    "Khách hàng %s đã dời lịch hẹn xem '%s' sang %s. Vui lòng xác nhận lại.",
                    appointment.getCustomer().getFullName(),
                    appointment.getProperty().getTitle(),
                    newDateTime
                );
                
                notificationService.createNotification(
                    appointment.getBroker(),
                    "appointment_rescheduled",
                    "Khách hàng dời lịch hẹn",
                    notificationMessage,
                    "broker"
                );
            }
            if ("direct_payment".equalsIgnoreCase(appointment.getAppointmentType())) {
                syncDirectPaymentTransactionSchedule(appointment, request.getScheduledAt());
            }
        }

        return convertToDTO(appointmentRepository.save(appointment));
    }

    @Transactional
    public void cancelAppointment(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Only customer or broker of this appointment or admin can cancel
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền hủy lịch hẹn này");
        }

        // Check if appointment is already completed or cancelled
        if ("completed".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Không thể hủy lịch hẹn đã hoàn thành");
        }

        if ("cancelled".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Lịch hẹn này đã được hủy trước đó");
        }

        // Xử lý điểm uy tín nếu là customer hủy
        if (appointment.getCustomer().getUserId().equals(currentUser.getUserId())) {
            reputationService.handleCancelAppointment(appointment, appointment.getNote());
        }

        appointment.setStatus("cancelled");
        
        // Gửi thông báo hủy lịch
        if (appointment.getCustomer().getUserId().equals(currentUser.getUserId())) {
            // Khách hàng hủy -> báo môi giới
            notificationService.createNotification(
                appointment.getBroker(),
                "appointment_cancelled",
                "Khách hàng hủy lịch hẹn",
                String.format("Khách hàng %s đã hủy lịch hẹn xem '%s'.", 
                    appointment.getCustomer().getFullName(), appointment.getProperty().getTitle()),
                "broker"
            );
        } else if (appointment.getBroker().getUserId().equals(currentUser.getUserId())) {
            // Môi giới hủy -> báo khách hàng
            notificationService.createNotification(
                appointment.getCustomer(),
                "appointment_cancelled",
                "Môi giới hủy lịch hẹn",
                String.format("Môi giới %s đã hủy lịch hẹn xem '%s'.", 
                    appointment.getBroker().getFullName(), appointment.getProperty().getTitle()),
                "customer"
            );
        } else {
            // Admin hủy -> báo cả hai
            notificationService.createNotification(
                appointment.getBroker(),
                "appointment_cancelled",
                "Lịch hẹn bị hủy bởi Admin",
                String.format("Admin đã hủy lịch hẹn xem '%s'.", appointment.getProperty().getTitle()),
                "broker"
            );
            notificationService.createNotification(
                appointment.getCustomer(),
                "appointment_cancelled",
                "Lịch hẹn bị hủy bởi Admin",
                String.format("Admin đã hủy lịch hẹn xem '%s'.", appointment.getProperty().getTitle()),
                "customer"
            );
        }
        
        appointmentRepository.save(appointment);
    }

    public AppointmentDTO getCancellationInfo(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check permission
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền xem thông tin lịch hẹn này");
        }

        AppointmentDTO dto = convertToDTO(appointment);
        
        // Calculate hours until appointment
        long hoursUntilAppointment = java.time.Duration.between(
            java.time.LocalDateTime.now(),
            appointment.getScheduledAt()
        ).toHours();
        
        dto.setHoursUntilAppointment(hoursUntilAppointment);
        dto.setIsWithin24Hours(hoursUntilAppointment < 24 && hoursUntilAppointment > 0);
        
        // Kiểm tra xem lịch hẹn đã được confirmed chưa
        boolean isConfirmed = "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                             "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                             "viewed".equalsIgnoreCase(appointment.getStatus());
        dto.setIsConfirmed(isConfirmed);
        
        // Debug log
        System.out.println("=== CANCELLATION INFO DEBUG ===");
        System.out.println("Appointment ID: " + appointment.getAppointmentId());
        System.out.println("Status: " + appointment.getStatus());
        System.out.println("Is Confirmed: " + isConfirmed);
        System.out.println("Hours Until: " + hoursUntilAppointment);
        
        // Tính điểm sẽ bị trừ nếu hủy lịch
        if (isConfirmed) {
            if (hoursUntilAppointment < 24 && hoursUntilAppointment > 0) {
                dto.setCancelPointsPenalty(ReputationService.POINTS_CANCEL_WITHIN_24H);
            } else if (hoursUntilAppointment >= 24) {
                dto.setCancelPointsPenalty(ReputationService.POINTS_CANCEL_AFTER_24H);
            }
        }
        
        return dto;
    }

    public AppointmentDTO getRescheduleInfo(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check permission
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền xem thông tin lịch hẹn này");
        }

        AppointmentDTO dto = convertToDTO(appointment);
        
        // Calculate hours until appointment
        long hoursUntilAppointment = java.time.Duration.between(
            java.time.LocalDateTime.now(),
            appointment.getScheduledAt()
        ).toHours();
        
        dto.setHoursUntilAppointment(hoursUntilAppointment);
        dto.setIsWithin24Hours(hoursUntilAppointment < 24 && hoursUntilAppointment > 0);
        
        // Kiểm tra xem lịch hẹn đã được confirmed chưa
        boolean isConfirmed = "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                             "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                             "viewed".equalsIgnoreCase(appointment.getStatus());
        dto.setIsConfirmed(isConfirmed);
        
        // Tính điểm sẽ bị trừ nếu dời lịch
        if (isConfirmed) {
            if (hoursUntilAppointment < 24 && hoursUntilAppointment > 0) {
                dto.setReschedulePointsPenalty(ReputationService.POINTS_RESCHEDULE_CONFIRMED_WITHIN_24H);
            } else if (hoursUntilAppointment >= 24) {
                dto.setReschedulePointsPenalty(ReputationService.POINTS_RESCHEDULE_CONFIRMED_AFTER_24H);
            }
        }
        
        return dto;
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setScheduledAt(appointment.getScheduledAt());
        dto.setStatus(appointment.getStatus());
        dto.setAppointmentType(appointment.getAppointmentType() == null ? "property_viewing" : appointment.getAppointmentType());
        dto.setNote(appointment.getNote());
        if ("direct_payment".equalsIgnoreCase(dto.getAppointmentType())) {
            transactionRepository.findByProperty(appointment.getProperty()).stream()
                    .filter(transaction -> transaction.getCustomer() != null
                            && transaction.getCustomer().getUserId().equals(appointment.getCustomer().getUserId()))
                    .filter(transaction -> transaction.getBroker() != null
                            && transaction.getBroker().getUserId().equals(appointment.getBroker().getUserId()))
                    .filter(transaction -> transaction.getDealScheduleAt() != null
                            && transaction.getDealScheduleAt().equals(appointment.getScheduledAt()))
                    .findFirst()
                    .ifPresent(transaction -> dto.setTransactionId(transaction.getTransactionId()));
        }
        
        // Property info
        dto.setPropertyId(appointment.getProperty().getPropertyId());
        dto.setPropertyTitle(appointment.getProperty().getTitle());
        dto.setPropertyAddress(appointment.getProperty().getDistrict() + ", " + appointment.getProperty().getProvince());
        
        // Get primary image
        if (appointment.getProperty().getImages() != null && !appointment.getProperty().getImages().isEmpty()) {
            dto.setPropertyImage(appointment.getProperty().getImages().stream()
                .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                .findFirst()
                .map(img -> img.getUrl())
                .orElse(appointment.getProperty().getImages().get(0).getUrl()));
        }
        
        // Customer info
        dto.setCustomerId(appointment.getCustomer().getUserId());
        dto.setCustomerName(appointment.getCustomer().getFullName());
        dto.setCustomerPhone(appointment.getCustomer().getPhone());
        dto.setCustomerEmail(appointment.getCustomer().getEmail());
        
        // Broker info
        dto.setBrokerId(appointment.getBroker().getUserId());
        dto.setBrokerName(appointment.getBroker().getFullName());
        dto.setBrokerEmail(appointment.getBroker().getEmail());
        
        // Contact info (nếu có, nếu không dùng customer info)
        dto.setContactName(appointment.getCustomer().getFullName());
        dto.setContactPhone(appointment.getCustomer().getPhone());
        dto.setContactEmail(appointment.getCustomer().getEmail());
        
        return dto;
    }

    private void syncDirectPaymentTransactionSchedule(Appointment appointment, java.time.LocalDateTime scheduledAt) {
        transactionRepository.findByProperty(appointment.getProperty()).stream()
                .filter(transaction -> "deal_scheduled".equalsIgnoreCase(transaction.getStatus()))
                .filter(transaction -> transaction.getCustomer() != null
                        && transaction.getCustomer().getUserId().equals(appointment.getCustomer().getUserId()))
                .filter(transaction -> transaction.getBroker() != null
                        && transaction.getBroker().getUserId().equals(appointment.getBroker().getUserId()))
                .findFirst()
                .ifPresent(transaction -> {
                    transaction.setDealScheduleAt(scheduledAt);
                    transactionRepository.save(transaction);
                });
    }
}

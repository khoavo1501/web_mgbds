package com.realestate.management.service;

import com.realestate.management.dto.TransactionDTO;
import com.realestate.management.dto.TransactionRequest;
import com.realestate.management.entity.*;
import com.realestate.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private CommissionRepository commissionRepository;
    @Autowired private TransactionPaymentRepository transactionPaymentRepository;
    @Autowired private TransactionDocumentRepository transactionDocumentRepository;
    @Autowired private AuditLogService auditLogService;
    @Autowired private NotificationService notificationService;

    @Value("${app.upload.document-dir:documents}")
    private String documentDir;

    /** Lấy danh sách giao dịch theo role */
    public List<TransactionDTO> getMyTransactions() {
        User currentUser = getCurrentUser();
        List<Transaction> list;

        switch (currentUser.getRole().toLowerCase()) {
            case "broker"   -> list = transactionRepository.findByBroker(currentUser);
            case "customer" -> list = transactionRepository.findByCustomer(currentUser);
            default         -> list = transactionRepository.findAll(); // admin
        }

        return list.stream()
                .map(this::syncCustomerIdentityVerification)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /** Lấy chi tiết 1 giao dịch */
    public TransactionDTO getTransactionById(Long id) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        return convertToDTO(syncCustomerIdentityVerification(t));
    }

    /** Tạo giao dịch mới (Broker) */
    @Transactional
    public TransactionDTO createTransaction(TransactionRequest request) {
        User currentUser = getCurrentUser();

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BĐS ID: " + request.getPropertyId()));

        if (!"published".equalsIgnoreCase(property.getStatus())) {
            throw new RuntimeException("Chỉ có thể tạo giao dịch cho BĐS đang được xuất bản");
        }

        boolean hasOpenTransaction = transactionRepository.findByProperty(property).stream()
                .anyMatch(transaction -> !"completed".equalsIgnoreCase(transaction.getStatus())
                        && !"cancelled".equalsIgnoreCase(transaction.getStatus()));
        if (hasOpenTransaction) {
            throw new RuntimeException("BĐS này đang có giao dịch chưa hoàn tất");
        }

        User broker = currentUser;
        if ("admin".equalsIgnoreCase(currentUser.getRole()) && property.getAssignedTo() != null) {
            broker = property.getAssignedTo();
        }

        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            boolean isCreator = property.getCreatedBy() != null && property.getCreatedBy().getUserId().equals(currentUser.getUserId());
            boolean isAssigned = property.getAssignedTo() != null && property.getAssignedTo().getUserId().equals(currentUser.getUserId());
            if (!isCreator && !isAssigned) {
                throw new RuntimeException("Bạn không có quyền tạo giao dịch cho BĐS này");
            }
        }

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng ID: " + request.getCustomerId()));

        if (!"customer".equalsIgnoreCase(customer.getRole())) {
            throw new RuntimeException("Người mua phải là tài khoản customer");
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay lich hen ID: " + request.getAppointmentId()));
            if (!appointment.getProperty().getPropertyId().equals(property.getPropertyId())
                    || !appointment.getCustomer().getUserId().equals(customer.getUserId())) {
                throw new RuntimeException("Lich hen khong khop voi khach hang hoac BDS");
            }
            if (!"viewed".equalsIgnoreCase(appointment.getStatus())) {
                throw new RuntimeException("Chi duoc tao giao dich sau khi moi gioi xac nhan khach da xem nha");
            }
        }

        if (request.getDepositAmount() != null && request.getDepositAmount().compareTo(request.getTotalPrice()) > 0) {
            throw new RuntimeException("Tiền cọc không được lớn hơn tổng giá trị giao dịch");
        }

        // Tạo mã giao dịch
        String code = generateTransactionCode();

        Transaction transaction = new Transaction();
        transaction.setTransactionCode(code);
        transaction.setProperty(property);
        transaction.setCustomer(customer);
        transaction.setBroker(broker);
        transaction.setAppointment(appointment);
        transaction.setTotalPrice(request.getTotalPrice());
        java.math.BigDecimal depositAmount = request.getDepositAmount();
        if (depositAmount == null || depositAmount.signum() == 0) {
            depositAmount = request.getTotalPrice().multiply(new java.math.BigDecimal("0.10"));
        }
        transaction.setDepositAmount(depositAmount);
        transaction.setStatus("pending");
        transaction.setTransactionDate(LocalDate.now());

        Transaction saved = transactionRepository.save(transaction);

        if (transaction.getDepositAmount() != null && transaction.getDepositAmount().signum() > 0) {
            TransactionPayment depositPayment = new TransactionPayment();
            depositPayment.setTransaction(saved);
            depositPayment.setAmount(transaction.getDepositAmount());
            depositPayment.setPaymentMethod(normalizePaymentMethod(request.getPaymentMethod()));
            depositPayment.setPaymentDate(LocalDate.now());
            if (isFullyPaid(saved)) {
                depositPayment.setPaymentStatus("confirmed");
                depositPayment.setConfirmedBy(currentUser);
            } else {
                depositPayment.setPaymentStatus("pending");
            }
            transactionPaymentRepository.save(depositPayment);
        }

        // Tự động tạo hoa hồng 2% cho broker
        Commission commission = new Commission();
        commission.setTransaction(saved);
        commission.setUser(broker);
        commission.setAmount(calculateBrokerCommission(request.getTotalPrice()));
        commission.setStatus(isFullyPaid(saved) ? "paid" : "pending");
        commissionRepository.save(commission);

        if (isFullyPaid(saved)) {
            saved.setStatus("completed");
            property.setStatus("sold");
            propertyRepository.save(property);
            saved = transactionRepository.save(saved);
        } else {
            property.setStatus("in_transaction");
            propertyRepository.save(property);
        }

        auditLogService.log(null, saved.getStatus(), "CREATE_TRANSACTION", "Transaction", saved.getTransactionId());

        return convertToDTO(saved);
    }

    @Transactional
    public TransactionDTO createCustomerDepositFromAppointment(Long appointmentId) {
        User currentUser = getCurrentUser();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay lich hen ID: " + appointmentId));

        if (!"customer".equalsIgnoreCase(currentUser.getRole())
                || !appointment.getCustomer().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chi khach hang cua lich hen moi duoc dat coc");
        }
        if (!"viewed".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Moi gioi can xac nhan da dan khach di xem nha truoc khi dat coc");
        }

        Property property = appointment.getProperty();
        if (!"published".equalsIgnoreCase(property.getStatus())) {
            throw new RuntimeException("BDS nay khong con o trang thai co the dat coc");
        }

        boolean hasOpenTransaction = transactionRepository.findByProperty(property).stream()
                .anyMatch(transaction -> !"completed".equalsIgnoreCase(transaction.getStatus())
                        && !"cancelled".equalsIgnoreCase(transaction.getStatus())
                        && !"refunded".equalsIgnoreCase(transaction.getStatus()));
        if (hasOpenTransaction) {
            throw new RuntimeException("BDS nay dang co giao dich chua hoan tat");
        }

        java.math.BigDecimal depositAmount = property.getPrice().multiply(new java.math.BigDecimal("0.10"));
        Transaction transaction = new Transaction();
        transaction.setTransactionCode(generateTransactionCode());
        transaction.setProperty(property);
        transaction.setCustomer(currentUser);
        transaction.setBroker(appointment.getBroker());
        transaction.setAppointment(appointment);
        transaction.setTotalPrice(property.getPrice());
        transaction.setDepositAmount(depositAmount);
        transaction.setStatus("pending");
        transaction.setTransactionDate(LocalDate.now());
        transaction.setExpiredAt(java.time.LocalDateTime.now().plusHours(12));

        Transaction saved = transactionRepository.save(transaction);

        TransactionPayment depositPayment = new TransactionPayment();
        depositPayment.setTransaction(saved);
        depositPayment.setAmount(depositAmount);
        depositPayment.setPaymentMethod("transfer");
        depositPayment.setPaymentStatus("submitted");
        depositPayment.setPaymentDate(LocalDate.now());
        transactionPaymentRepository.save(depositPayment);

        Commission commission = new Commission();
        commission.setTransaction(saved);
        commission.setUser(appointment.getBroker());
        commission.setAmount(calculateBrokerCommission(property.getPrice()));
        commission.setStatus("pending");
        commissionRepository.save(commission);

        property.setStatus("in_transaction");
        propertyRepository.save(property);

        auditLogService.log(null, saved.getStatus(), "CREATE_TRANSACTION", "Transaction", saved.getTransactionId());

        return convertToDTO(saved);
    }

    /** Cập nhật trạng thái giao dịch */
    @Transactional
    public TransactionDTO updateStatus(Long id, String status) {
        if (!status.matches("customer_confirmed|contract_agreed|documents_submitted|documents_verified|payment_submitted|deposit_confirmed|commitment_signed|notarizing|completed|cancelled|rejected|refund_requested|refunded|broker_confirmed|deal_scheduled")) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));

        User currentUser = getCurrentUser();
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        boolean isCustomer = t.getCustomer() != null && t.getCustomer().getUserId().equals(currentUser.getUserId());
        boolean isBroker = t.getBroker() != null && t.getBroker().getUserId().equals(currentUser.getUserId());

        if (List.of("documents_verified", "deposit_confirmed", "refunded", "completed").contains(status) && !isAdmin) {
            throw new RuntimeException("Chỉ admin mới được xác nhận hồ sơ, thanh toán, hoặc hoàn tất giao dịch");
        }

        if (List.of("customer_confirmed", "contract_agreed", "payment_submitted", "commitment_signed", "refund_requested").contains(status) && !isCustomer) {
            throw new RuntimeException("Chỉ khách hàng của giao dịch mới được cập nhật bước này");
        }

        if ("broker_confirmed".equals(status) && !isBroker) {
            throw new RuntimeException("Chi moi gioi phu trach moi duoc xac nhan giao dich truc tiep");
        }

        String beforeStatus = t.getStatus();

        // Specific status transitions validation could be added here if needed.
        if ("payment_submitted".equals(status) && !"documents_verified".equals(beforeStatus)) {
            throw new RuntimeException("Can duoc admin xac thuc ho so truoc khi thanh toan coc");
        }

        if ("payment_submitted".equals(status)) {
            markDepositPaymentSubmitted(t);
        }

        if ("refund_requested".equals(status)
                && !"broker_confirmed".equals(beforeStatus)
                && !"completed".equals(beforeStatus)
                && !("cancelled".equals(beforeStatus) && hasConfirmedDeposit(t))) {
            throw new RuntimeException("Chi duoc yeu cau hoan coc sau khi moi gioi xac nhan giao dich thanh cong");
        }

        t.setStatus(status);

        if ("customer_confirmed".equals(status) && t.getCustomer() != null
                && "verified".equalsIgnoreCase(t.getCustomer().getIdentityVerificationStatus())) {
            t.setStatus("documents_verified");
            status = "documents_verified";
        }

        if ("customer_confirmed".equals(status) || "documents_verified".equals(status)) {
            t.setExpiredAt(java.time.LocalDateTime.now().plusHours(12));
        }

        if ("documents_submitted".equals(status) || "payment_submitted".equals(status)) {
            t.setExpiredAt(null);
        }

        if ("deposit_confirmed".equals(status)) {
            if (t.getProperty() != null && "deposit_paid".equalsIgnoreCase(t.getProperty().getStatus())) {
                throw new RuntimeException("Bất động sản này đã được đặt cọc bởi giao dịch khác");
            }
            transactionPaymentRepository.findByTransaction(t).forEach(payment -> {
                if (payment.getConfirmedBy() == null) {
                    payment.setConfirmedBy(currentUser);
                }
                payment.setPaymentStatus("confirmed");
                transactionPaymentRepository.save(payment);
            });
            if (t.getProperty() != null) {
                t.getProperty().setStatus("deposit_paid");
                t.getProperty().setIsLocked(true);
                propertyRepository.save(t.getProperty());
                markPropertyAppointmentsCompleted(t.getProperty());
            }
            t.setLockedAt(java.time.LocalDateTime.now());
        }

        if ("broker_confirmed".equals(status)) {
            if (!"deal_scheduled".equals(beforeStatus)) {
                throw new RuntimeException("Chi xac nhan giao dich sau khi khach hang da dat lich giao dich truc tiep");
            }
            if (!hasConfirmedDirectPaymentAppointment(t)) {
                throw new RuntimeException("Moi gioi can xac nhan lich giao dich truc tiep truoc khi xac nhan giao dich thanh cong");
            }
            markDirectPaymentAppointments(t, "completed");
            if (t.getProperty() != null) {
                t.getProperty().setStatus("deposit_paid");
                t.getProperty().setIsLocked(true);
                propertyRepository.save(t.getProperty());
            }
            commissionRepository.findByTransaction(t).forEach(c -> {
                c.setStatus("paid");
                commissionRepository.save(c);
            });
        }

        if ("refund_requested".equals(status)) {
            transactionPaymentRepository.findByTransaction(t).forEach(payment -> {
                if ("confirmed".equalsIgnoreCase(payment.getPaymentStatus())) {
                    payment.setPaymentStatus("refund_requested");
                    transactionPaymentRepository.save(payment);
                }
            });
        }

        if ("refunded".equals(status)) {
            transactionPaymentRepository.findByTransaction(t).forEach(payment -> {
                if ("refund_requested".equalsIgnoreCase(payment.getPaymentStatus())
                        || "confirmed".equalsIgnoreCase(payment.getPaymentStatus())) {
                    payment.setPaymentStatus("refunded");
                    transactionPaymentRepository.save(payment);
                }
            });
            if (t.getProperty() != null && "deposit_paid".equalsIgnoreCase(t.getProperty().getStatus())) {
                t.getProperty().setStatus("sold");
                t.getProperty().setIsLocked(false);
                propertyRepository.save(t.getProperty());
            }
        }

        if ("completed".equals(status)) {
            if (t.getProperty() != null) {
                t.getProperty().setStatus("sold");
                t.getProperty().setIsLocked(false);
                propertyRepository.save(t.getProperty());
            }
            commissionRepository.findByTransaction(t).forEach(c -> {
                c.setStatus("paid");
                commissionRepository.save(c);
            });
            
            // Notify customer and broker
            if (t.getCustomer() != null) {
                notificationService.createNotification(
                    t.getCustomer(), 
                    "transaction_completed", 
                    "Giao dịch hoàn tất", 
                    "Giao dịch " + t.getTransactionCode() + " đã được xác nhận hoàn tất thành công. Chúc mừng bạn đã sở hữu bất động sản " + (t.getProperty() != null ? t.getProperty().getTitle() : "") + "!", 
                    "CUSTOMER"
                );
            }
            if (t.getBroker() != null) {
                notificationService.createNotification(
                    t.getBroker(), 
                    "transaction_completed", 
                    "Giao dịch hoàn tất", 
                    "Giao dịch " + t.getTransactionCode() + " đã được xác nhận hoàn tất. Hoa hồng của bạn đã được chuyển vào trạng thái 'Đã thanh toán'.", 
                    "BROKER"
                );
            }
        }

        if ("cancelled".equals(status) || "rejected".equals(status)) {
            commissionRepository.findByTransaction(t).forEach(c -> {
                c.setStatus("cancelled");
                commissionRepository.save(c);
            });
            if (t.getProperty() != null) {
                t.getProperty().setStatus("published");
                t.getProperty().setIsLocked(false);
                propertyRepository.save(t.getProperty());
            }
        }

        Transaction saved = transactionRepository.save(t);
        
        auditLogService.log(beforeStatus, status, "UPDATE_TRANSACTION_STATUS", "Transaction", t.getTransactionId());

        return convertToDTO(saved);
    }

    @Transactional
    public TransactionDTO submitDocuments(Long id, String cccdFrontUrl, String cccdBackUrl, String residenceUrl, String marriageUrl) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        User currentUser = getCurrentUser();
        if (transaction.getCustomer() == null || !transaction.getCustomer().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chỉ khách hàng của giao dịch mới được gửi hồ sơ");
        }
        if (!"customer_confirmed".equals(transaction.getStatus()) && !"documents_submitted".equals(transaction.getStatus())) {
            throw new RuntimeException("Cần xác nhận giao dịch trước khi gửi hồ sơ");
        }
        if (cccdFrontUrl == null || cccdBackUrl == null || residenceUrl == null) {
             throw new RuntimeException("Thiếu các file bắt buộc");
        }

        // Archive old documents
        List<TransactionDocument> oldDocs = transactionDocumentRepository.findByTransaction(transaction);
        for (TransactionDocument oldDoc : oldDocs) {
            oldDoc.setStatus("archived");
        }
        transactionDocumentRepository.saveAll(oldDocs);

        List<TransactionDocument> documents = new ArrayList<>();
        documents.add(createDocument(transaction, "cccd_front", cccdFrontUrl));
        documents.add(createDocument(transaction, "cccd_back", cccdBackUrl));
        documents.add(createDocument(transaction, "residence", residenceUrl));
        if (marriageUrl != null && !marriageUrl.isEmpty()) {
            documents.add(createDocument(transaction, "marriage", marriageUrl));
        }
        transactionDocumentRepository.saveAll(documents);

        transaction.setStatus("documents_submitted");
        transaction.setExpiredAt(null);
        return convertToDTO(transactionRepository.save(transaction));
    }

    private TransactionDocument createDocument(Transaction transaction, String type, String url) {
        TransactionDocument doc = new TransactionDocument();
        doc.setTransaction(transaction);
        doc.setDocumentType(type);
        doc.setFileUrl(url);
        
        // Trích xuất fileName từ URL để tránh lỗi NOT NULL constraint trong DB
        if (url != null && url.contains("/")) {
            doc.setFileName(url.substring(url.lastIndexOf("/") + 1));
        } else {
            doc.setFileName(type + "_document");
        }
        
        doc.setUrl(url); // Populate legacy url column to avoid NOT NULL constraint
        doc.setUploadedBy(getCurrentUser());
        
        doc.setStatus("pending_review");
        return doc;
    }

    @Transactional
    public void addPaymentReceipt(Long id, String receiptUrl) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        TransactionDocument receipt = createDocument(transaction, "receipt", receiptUrl);
        transactionDocumentRepository.save(receipt);
    }

    @Transactional
    public TransactionDTO verifyDocument(Long transactionId, Long documentId) {
        TransactionDocument doc = transactionDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy document ID: " + documentId));
        doc.setStatus("verified");
        doc.setReviewedBy(getCurrentUser());
        doc.setReviewedAt(java.time.LocalDateTime.now());
        transactionDocumentRepository.save(doc);

        checkAndCompleteDocumentVerification(transactionId);
        return convertToDTO(transactionRepository.findById(transactionId).get());
    }

    @Transactional
    public TransactionDTO rejectDocument(Long transactionId, Long documentId, String reason) {
        TransactionDocument doc = transactionDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy document ID: " + documentId));
        doc.setStatus("rejected");
        doc.setRejectReason(reason);
        doc.setReviewedBy(getCurrentUser());
        doc.setReviewedAt(java.time.LocalDateTime.now());
        transactionDocumentRepository.save(doc);
        return convertToDTO(transactionRepository.findById(transactionId).get());
    }

    private void checkAndCompleteDocumentVerification(Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId).get();
        List<TransactionDocument> docs = transactionDocumentRepository.findByTransaction(tx);
        
        // Chỉ tính các doc không bị archived
        boolean allVerified = docs.stream()
                .filter(d -> !"archived".equals(d.getStatus()) && !d.getDocumentType().equals("receipt"))
                .allMatch(d -> "verified".equals(d.getStatus()));
                
        boolean hasPendingOrRejected = docs.stream()
                .filter(d -> !"archived".equals(d.getStatus()) && !d.getDocumentType().equals("receipt"))
                .anyMatch(d -> "pending_review".equals(d.getStatus()) || "rejected".equals(d.getStatus()));

        if (allVerified && !hasPendingOrRejected) {
            tx.setStatus("documents_verified");
            tx.setExpiredAt(java.time.LocalDateTime.now().plusHours(12));
            transactionRepository.save(tx);
        }
    }

    @Transactional
    public TransactionDTO scheduleDeal(Long id, java.time.LocalDateTime scheduledAt) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich ID: " + id));
        User currentUser = getCurrentUser();
        if (transaction.getCustomer() == null || !transaction.getCustomer().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chi khach hang cua giao dich moi duoc dat lich giao dich");
        }
        if (!"deposit_confirmed".equals(transaction.getStatus())) {
            throw new RuntimeException("Can duoc xac nhan coc truoc khi dat lich giao dich truc tiep");
        }
        if (scheduledAt == null || scheduledAt.isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Thoi gian giao dich phai nam trong tuong lai");
        }

        Appointment dealAppointment = new Appointment();
        dealAppointment.setProperty(transaction.getProperty());
        dealAppointment.setCustomer(transaction.getCustomer());
        dealAppointment.setBroker(transaction.getBroker());
        dealAppointment.setScheduledAt(scheduledAt);
        dealAppointment.setStatus("pending");
        dealAppointment.setAppointmentType("direct_payment");
        dealAppointment.setNote("Direct payment appointment for transaction " + transaction.getTransactionCode());
        appointmentRepository.save(dealAppointment);

        transaction.setDealScheduleAt(scheduledAt);
        transaction.setStatus("deal_scheduled");
        return convertToDTO(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionDTO rejectBrokerDeal(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich ID: " + id));
        User currentUser = getCurrentUser();
        if (transaction.getBroker() == null || !transaction.getBroker().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chi moi gioi phu trach moi duoc xac nhan giao dich that bai");
        }
        if (!"deal_scheduled".equals(transaction.getStatus())) {
            throw new RuntimeException("Chi duoc xac nhan that bai sau khi khach hang da dat lich giao dich truc tiep");
        }

        String beforeStatus = transaction.getStatus();
        transaction.setStatus("cancelled");
        markDirectPaymentAppointments(transaction, "cancelled");
        if (transaction.getProperty() != null) {
            transaction.getProperty().setStatus("published");
            transaction.getProperty().setIsLocked(false);
            propertyRepository.save(transaction.getProperty());
        }
        commissionRepository.findByTransaction(transaction).forEach(c -> {
            c.setStatus("cancelled");
            commissionRepository.save(c);
        });

        Transaction saved = transactionRepository.save(transaction);
        auditLogService.log(beforeStatus, saved.getStatus(), "BROKER_REJECT_DEAL", "Transaction", saved.getTransactionId());
        return convertToDTO(saved);
    }

    private synchronized String generateTransactionCode() {
        String prefix = "TXN-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        List<Transaction> all = transactionRepository.findAll();
        int max = all.stream()
                .filter(t -> t.getTransactionCode() != null && t.getTransactionCode().startsWith(prefix))
                .mapToInt(t -> {
                    try { return Integer.parseInt(t.getTransactionCode().substring(prefix.length())); }
                    catch (Exception e) { return 0; }
                }).max().orElse(0);
        return String.format("%s%04d", prefix, max + 1);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    private TransactionDTO convertToDTO(Transaction t) {
        TransactionDTO dto = new TransactionDTO();
        dto.setTransactionId(t.getTransactionId());
        dto.setTransactionCode(t.getTransactionCode());
        dto.setTotalPrice(t.getTotalPrice());
        dto.setDepositAmount(t.getDepositAmount());
        dto.setStatus(t.getStatus());
        dto.setTransactionDate(t.getTransactionDate());
        dto.setDealScheduleAt(t.getDealScheduleAt());
        dto.setExpiredAt(t.getExpiredAt());
        dto.setLockedAt(t.getLockedAt());

        if (t.getProperty() != null) {
            dto.setPropertyId(t.getProperty().getPropertyId());
            dto.setPropertyTitle(t.getProperty().getTitle());
            dto.setPropertyCode(t.getProperty().getPropertyCode());
            dto.setPropertyType(t.getProperty().getPropertyType());
            dto.setPropertyProvince(t.getProperty().getProvince());
            dto.setPropertyDistrict(t.getProperty().getDistrict());
            dto.setPropertyArea(t.getProperty().getArea());
            dto.setPropertyPrice(t.getProperty().getPrice());
            
            if (t.getProperty().getImages() != null && !t.getProperty().getImages().isEmpty()) {
                PropertyImage primaryImage = t.getProperty().getImages().stream()
                        .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                        .findFirst()
                        .orElse(t.getProperty().getImages().get(0));
                dto.setPropertyImageUrl(primaryImage.getUrl());
            }
        }

        List<TransactionPayment> payments = transactionPaymentRepository.findByTransaction(t);
        List<TransactionDocument> documents = transactionDocumentRepository.findByTransaction(t);
        java.math.BigDecimal paidAmount = payments.stream()
                .filter(payment -> !"refunded".equalsIgnoreCase(payment.getPaymentStatus()))
                .map(TransactionPayment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal remainingAmount = t.getTotalPrice().subtract(paidAmount);
        dto.setRemainingAmount(remainingAmount.signum() < 0 ? java.math.BigDecimal.ZERO : remainingAmount);
        java.math.BigDecimal commissionDeduction = calculateTotalCommission(t.getTotalPrice());
        dto.setBrokerCommissionAmount(calculateBrokerCommission(t.getTotalPrice()));
        dto.setCompanyCommissionAmount(calculateCompanyCommission(t.getTotalPrice()));
        java.math.BigDecimal refundableDeposit = (t.getDepositAmount() == null ? java.math.BigDecimal.ZERO : t.getDepositAmount())
                .subtract(commissionDeduction);
        if (refundableDeposit.signum() < 0) {
            refundableDeposit = java.math.BigDecimal.ZERO;
        }
        dto.setCommissionDeduction(commissionDeduction);
        dto.setRefundableDeposit(refundableDeposit);
        dto.setDepositConfirmed(payments.stream().anyMatch(payment -> payment.getConfirmedBy() != null
                || "confirmed".equalsIgnoreCase(payment.getPaymentStatus())));
        dto.setDocumentsSubmitted(documents.size() >= 3);
        dto.setDocumentsVerified("documents_verified".equals(t.getStatus())
                || "payment_submitted".equals(t.getStatus())
                || "deposit_confirmed".equals(t.getStatus())
                || "commitment_signed".equals(t.getStatus())
                || "deal_scheduled".equals(t.getStatus())
                || "broker_confirmed".equals(t.getStatus())
                || "refund_requested".equals(t.getStatus())
                || "refunded".equals(t.getStatus())
                || "completed".equals(t.getStatus()));
        dto.setPaymentMethod(payments.stream()
                .findFirst()
                .map(TransactionPayment::getPaymentMethod)
                .orElse(null));
        dto.setDocuments(documents.stream()
                .map(document -> new TransactionDTO.TransactionDocumentDTO(
                        document.getDocumentId(),
                        document.getDocumentType(),
                        document.getFileName(),
                        document.getFileUrl(),
                        document.getStatus(),
                        document.getRejectReason(),
                        document.getUploadedAt(),
                        document.getReviewedAt(),
                        document.getReviewedBy() != null ? document.getReviewedBy().getFullName() : null
                ))
                .collect(Collectors.toList()));
        dto.setPayments(payments.stream()
                .map(payment -> new TransactionDTO.TransactionPaymentDTO(
                        payment.getPaymentId(),
                        payment.getAmount(),
                        payment.getPaymentMethod(),
                        payment.getPaymentStatus(),
                        payment.getPaymentDate(),
                        payment.getConfirmedBy() != null ? payment.getConfirmedBy().getFullName() : null
                ))
                .collect(Collectors.toList()));

        if (t.getCustomer() != null) {
            dto.setCustomerId(t.getCustomer().getUserId());
            dto.setCustomerName(t.getCustomer().getFullName());
            dto.setCustomerEmail(t.getCustomer().getEmail());
            dto.setCustomerPhone(t.getCustomer().getPhone());
            dto.setCustomerBankName(t.getCustomer().getBankName());
            dto.setCustomerBankAccountNumber(t.getCustomer().getBankAccountNumber());
            dto.setCustomerBankAccountHolder(t.getCustomer().getBankAccountHolder());
            dto.setCustomerIdentityStatus(t.getCustomer().getIdentityVerificationStatus());
            dto.setCustomerCccdFrontUrl(t.getCustomer().getCccdFrontUrl());
            dto.setCustomerCccdBackUrl(t.getCustomer().getCccdBackUrl());
            dto.setCustomerResidenceUrl(t.getCustomer().getResidenceUrl());
            dto.setCustomerIdentityRejectReason(t.getCustomer().getIdentityRejectReason());
        }
        if (t.getBroker() != null) {
            dto.setBrokerId(t.getBroker().getUserId());
            dto.setBrokerName(t.getBroker().getFullName());
            dto.setBrokerEmail(t.getBroker().getEmail());
        }
        if (t.getAppointment() != null) {
            dto.setAppointmentId(t.getAppointment().getAppointmentId());
            dto.setAppointmentScheduledAt(t.getAppointment().getScheduledAt());
            dto.setAppointmentStatus(t.getAppointment().getStatus());
            dto.setAppointmentNote(t.getAppointment().getNote());
        }
        return dto;
    }

    private Transaction syncCustomerIdentityVerification(Transaction transaction) {
        if ("customer_confirmed".equalsIgnoreCase(transaction.getStatus())
                && transaction.getCustomer() != null
                && "verified".equalsIgnoreCase(transaction.getCustomer().getIdentityVerificationStatus())) {
            transaction.setStatus("documents_verified");
            transaction.setExpiredAt(java.time.LocalDateTime.now().plusHours(12));
            return transactionRepository.save(transaction);
        }
        return transaction;
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return "transfer";
        }

        return switch (paymentMethod) {
            case "bank_transfer", "transfer" -> "transfer";
            case "cash" -> "cash";
            default -> "transfer";
        };
    }

    private boolean isFullyPaid(Transaction transaction) {
        if (transaction.getTotalPrice() == null || transaction.getDepositAmount() == null) {
            return false;
        }
        return transaction.getDepositAmount().compareTo(transaction.getTotalPrice()) >= 0;
    }

    private java.math.BigDecimal calculateTotalCommission(java.math.BigDecimal totalPrice) {
        if (totalPrice == null) {
            return java.math.BigDecimal.ZERO;
        }
        return totalPrice.multiply(new java.math.BigDecimal("0.02"));
    }

    private java.math.BigDecimal calculateBrokerCommission(java.math.BigDecimal totalPrice) {
        return calculateTotalCommission(totalPrice).multiply(new java.math.BigDecimal("0.60"));
    }

    private java.math.BigDecimal calculateCompanyCommission(java.math.BigDecimal totalPrice) {
        return calculateTotalCommission(totalPrice).multiply(new java.math.BigDecimal("0.40"));
    }

    private void markDepositPaymentSubmitted(Transaction transaction) {
        List<TransactionPayment> payments = transactionPaymentRepository.findByTransaction(transaction);
        TransactionPayment payment = payments.stream()
                .findFirst()
                .orElseGet(() -> {
                    TransactionPayment created = new TransactionPayment();
                    created.setTransaction(transaction);
                    created.setAmount(transaction.getDepositAmount() == null ? java.math.BigDecimal.ZERO : transaction.getDepositAmount());
                    created.setPaymentMethod("transfer");
                    created.setPaymentDate(LocalDate.now());
                    return created;
                });
        payment.setPaymentStatus("submitted");
        payment.setPaymentDate(LocalDate.now());
        transactionPaymentRepository.save(payment);
    }

    private void markPropertyAppointmentsCompleted(Property property) {
        appointmentRepository.findByProperty(property).stream()
                .filter(appointment -> !"cancelled".equalsIgnoreCase(appointment.getStatus()))
                .forEach(appointment -> {
                    appointment.setStatus("completed");
                    appointmentRepository.save(appointment);
                });
    }

    private boolean hasConfirmedDeposit(Transaction transaction) {
        return transactionPaymentRepository.findByTransaction(transaction).stream()
                .anyMatch(payment -> "confirmed".equalsIgnoreCase(payment.getPaymentStatus())
                        || payment.getConfirmedBy() != null);
    }

    private boolean hasConfirmedDirectPaymentAppointment(Transaction transaction) {
        if (transaction.getProperty() == null || transaction.getCustomer() == null || transaction.getBroker() == null
                || transaction.getDealScheduleAt() == null) {
            return false;
        }
        return appointmentRepository.findByProperty(transaction.getProperty()).stream()
                .filter(appointment -> "direct_payment".equalsIgnoreCase(appointment.getAppointmentType()))
                .filter(appointment -> appointment.getCustomer().getUserId().equals(transaction.getCustomer().getUserId()))
                .filter(appointment -> appointment.getBroker().getUserId().equals(transaction.getBroker().getUserId()))
                .filter(appointment -> transaction.getDealScheduleAt().equals(appointment.getScheduledAt()))
                .anyMatch(appointment -> "confirmed".equalsIgnoreCase(appointment.getStatus()));
    }

    private void markDirectPaymentAppointments(Transaction transaction, String status) {
        if (transaction.getProperty() == null || transaction.getCustomer() == null || transaction.getBroker() == null
                || transaction.getDealScheduleAt() == null) {
            return;
        }
        appointmentRepository.findByProperty(transaction.getProperty()).stream()
                .filter(appointment -> "direct_payment".equalsIgnoreCase(appointment.getAppointmentType()))
                .filter(appointment -> appointment.getCustomer().getUserId().equals(transaction.getCustomer().getUserId()))
                .filter(appointment -> appointment.getBroker().getUserId().equals(transaction.getBroker().getUserId()))
                .filter(appointment -> transaction.getDealScheduleAt().equals(appointment.getScheduledAt()))
                .forEach(appointment -> {
                    appointment.setStatus(status);
                    appointmentRepository.save(appointment);
                });
    }

    private void validateRequiredFile(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException(label + " không được để trống");
        }
    }

    private TransactionDocument saveDocument(Transaction transaction, String type, MultipartFile file) {
        try {
            Path uploadDir = Paths.get(documentDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);
            String originalName = file.getOriginalFilename() == null ? type : file.getOriginalFilename();
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalName.substring(dotIndex).toLowerCase();
            }
            String fileName = type + "-" + transaction.getTransactionId() + "-" + HexFormat.of().formatHex(UUID.randomUUID().toString().getBytes()).substring(0, 16) + extension;
            Path targetPath = uploadDir.resolve(fileName).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                throw new RuntimeException("Tên file không hợp lệ");
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath);
            }

            TransactionDocument document = new TransactionDocument();
            document.setTransaction(transaction);
            document.setDocumentType(type);
            document.setFileName(originalName);
            document.setFileUrl(ServletUriComponentsBuilder.fromCurrentContextPath().path("/documents/").path(fileName).toUriString());
            return document;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu hồ sơ: " + e.getMessage());
        }
    }

    /**
     * 🆕 Tự động tạo giao dịch khi broker xác nhận hoàn thành xem nhà
     * Giao dịch có thời hạn 24h để khách hàng đặt cọc
     */
    @Transactional
    public TransactionDTO createTransactionFromCompletedAppointment(Appointment appointment) {
        Property property = appointment.getProperty();
        
        // Kiểm tra BĐS còn available không
        if (!"published".equalsIgnoreCase(property.getStatus())) {
            throw new RuntimeException("BĐS này không còn ở trạng thái có thể giao dịch");
        }

        // Kiểm tra xem đã có giao dịch nào đã chuyển cọc thành công chưa
        boolean hasDepositConfirmedTransaction = transactionRepository.findByProperty(property).stream()
                .anyMatch(transaction -> java.util.List.of("deposit_confirmed", "commitment_signed", "deal_scheduled", "broker_confirmed", "completed")
                        .contains(transaction.getStatus().toLowerCase()));
        
        if (hasDepositConfirmedTransaction) {
            throw new RuntimeException("BĐS này đã được đặt cọc bởi giao dịch khác");
        }

        // Tính tiền cọc 10%
        java.math.BigDecimal depositAmount = property.getPrice().multiply(new java.math.BigDecimal("0.10"));
        
        // Tạo giao dịch
        Transaction transaction = new Transaction();
        transaction.setTransactionCode(generateTransactionCode());
        transaction.setProperty(property);
        transaction.setCustomer(appointment.getCustomer());
        transaction.setBroker(appointment.getBroker());
        transaction.setAppointment(appointment);
        transaction.setTotalPrice(property.getPrice());
        transaction.setDepositAmount(depositAmount);
        transaction.setStatus("pending_deposit"); // Trạng thái chờ đặt cọc
        transaction.setTransactionDate(LocalDate.now());
        transaction.setExpiredAt(java.time.LocalDateTime.now().plusHours(24)); // 24h để đặt cọc

        Transaction saved = transactionRepository.save(transaction);

        // Tạo commission cho broker (pending)
        Commission commission = new Commission();
        commission.setTransaction(saved);
        commission.setUser(appointment.getBroker());
        commission.setAmount(calculateBrokerCommission(property.getPrice()));
        commission.setStatus("pending");
        commissionRepository.save(commission);

        // Giữ trạng thái BĐS là published để khách khác vẫn có thể xem/đặt lịch cho đến khi có người cọc thành công

        auditLogService.log(null, saved.getStatus(), "AUTO_CREATE_TRANSACTION_FROM_APPOINTMENT", "Transaction", saved.getTransactionId());

        return convertToDTO(saved);
    }

    /**
     * 🆕 Khách hàng submit deposit payment cho giao dịch pending_deposit
     */
    @Transactional
    public TransactionDTO submitDepositPayment(Long transactionId) {
        User currentUser = getCurrentUser();
        
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + transactionId));

        // Kiểm tra quyền
        if (!transaction.getCustomer().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chỉ khách hàng của giao dịch mới được đặt cọc");
        }

        // Kiểm tra trạng thái
        if (!"pending_deposit".equalsIgnoreCase(transaction.getStatus())) {
            throw new RuntimeException("Giao dịch không ở trạng thái chờ đặt cọc");
        }

        // Kiểm tra hết hạn chưa
        if (transaction.getExpiredAt() != null && transaction.getExpiredAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Giao dịch đã hết hạn. Vui lòng đặt lịch xem nhà lại.");
        }

        // Tạo payment record
        TransactionPayment depositPayment = new TransactionPayment();
        depositPayment.setTransaction(transaction);
        depositPayment.setAmount(transaction.getDepositAmount());
        depositPayment.setPaymentMethod("transfer");
        depositPayment.setPaymentStatus("submitted"); // Chờ admin xác nhận
        depositPayment.setPaymentDate(LocalDate.now());
        transactionPaymentRepository.save(depositPayment);

        // Cập nhật trạng thái giao dịch
        transaction.setStatus("payment_submitted");
        transaction.setExpiredAt(null); // Xóa deadline vì đã submit
        Transaction saved = transactionRepository.save(transaction);

        auditLogService.log("pending_deposit", "payment_submitted", "SUBMIT_DEPOSIT_PAYMENT", "Transaction", saved.getTransactionId());

        // Thông báo cho broker và admin
        notificationService.createNotification(
            transaction.getBroker(),
            "deposit_submitted",
            "Khách hàng đã đặt cọc",
            String.format("Khách hàng %s đã nộp tiền cọc cho giao dịch %s. Vui lòng theo dõi.", 
                transaction.getCustomer().getFullName(), transaction.getTransactionCode()),
            "BROKER"
        );

        return convertToDTO(saved);
    }
}

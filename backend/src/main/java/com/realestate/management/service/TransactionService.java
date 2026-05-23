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

        return list.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /** Lấy chi tiết 1 giao dịch */
    public TransactionDTO getTransactionById(Long id) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        return convertToDTO(t);
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
        transaction.setStatus("payment_submitted");
        transaction.setTransactionDate(LocalDate.now());

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

        return convertToDTO(saved);
    }

    /** Cập nhật trạng thái giao dịch */
    @Transactional
    public TransactionDTO updateStatus(Long id, String status) {
        if (!status.matches("pending|customer_confirmed|documents_submitted|documents_verified|payment_submitted|deposit_confirmed|commitment_signed|deal_scheduled|broker_confirmed|refund_requested|refunded|completed|cancelled")) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));

        User currentUser = getCurrentUser();
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        boolean isCustomer = t.getCustomer() != null && t.getCustomer().getUserId().equals(currentUser.getUserId());
        boolean isBroker = t.getBroker() != null && t.getBroker().getUserId().equals(currentUser.getUserId());

        if (List.of("documents_verified", "deposit_confirmed", "refunded").contains(status) && !isAdmin) {
            throw new RuntimeException("Chỉ admin mới được xác minh hồ sơ hoặc xác nhận cọc");
        }

        if (List.of("customer_confirmed", "payment_submitted", "commitment_signed", "refund_requested").contains(status) && !isCustomer) {
            throw new RuntimeException("Chỉ khách hàng của giao dịch mới được cập nhật bước này");
        }

        if ("broker_confirmed".equals(status) && !isBroker) {
            throw new RuntimeException("Chi broker phu trach moi duoc xac nhan giao dich");
        }

        if ("customer_confirmed".equals(status) && !"pending".equals(t.getStatus())) {
            throw new RuntimeException("Chỉ giao dịch chờ xác nhận mới được khách hàng xác nhận");
        }

        if ("documents_verified".equals(status) && !"documents_submitted".equals(t.getStatus())) {
            throw new RuntimeException("Chỉ hồ sơ đã gửi mới được xác minh");
        }

        if ("payment_submitted".equals(status) && !"documents_verified".equals(t.getStatus())) {
            throw new RuntimeException("Cần xác minh hồ sơ trước khi báo đã thanh toán");
        }

        if ("deposit_confirmed".equals(status) && !"payment_submitted".equals(t.getStatus())) {
            throw new RuntimeException("Chỉ giao dịch đã báo thanh toán mới được xác nhận cọc");
        }

        if ("commitment_signed".equals(status) && !"deposit_confirmed".equals(t.getStatus())) {
            throw new RuntimeException("Can xac nhan coc truoc khi ky cam ket mua hang");
        }

        if ("broker_confirmed".equals(status) && !"deal_scheduled".equals(t.getStatus())) {
            throw new RuntimeException("Khach hang can dat lich giao dich BDS truoc");
        }

        if ("refund_requested".equals(status)
                && !"broker_confirmed".equals(t.getStatus())) {
            throw new RuntimeException("Chi duoc yeu cau hoan coc sau khi broker xac nhan giao dich thanh cong");
        }

        if ("refunded".equals(status) && !"refund_requested".equals(t.getStatus())) {
            throw new RuntimeException("Chi giao dich dang yeu cau hoan coc moi duoc danh dau da hoan");
        }

        if ("completed".equals(status) && !isFullyPaid(t)) {
            throw new RuntimeException("Giao dịch chỉ tự hoàn tất khi thanh toán đủ toàn bộ giá trị");
        }

        if ("payment_submitted".equals(status)) {
            markDepositPaymentSubmitted(t);
        }

        t.setStatus(status);

        if ("deposit_confirmed".equals(status)) {
            transactionPaymentRepository.findByTransaction(t).forEach(payment -> {
                if (payment.getConfirmedBy() == null) {
                    payment.setConfirmedBy(currentUser);
                }
                payment.setPaymentStatus("confirmed");
                transactionPaymentRepository.save(payment);
            });
        }

        if ("refund_requested".equals(status)) {
            transactionPaymentRepository.findByTransaction(t).forEach(payment -> {
                payment.setPaymentStatus("refund_requested");
                transactionPaymentRepository.save(payment);
            });
        }

        if ("refunded".equals(status)) {
            transactionPaymentRepository.findByTransaction(t).forEach(payment -> {
                payment.setPaymentStatus("refunded");
                transactionPaymentRepository.save(payment);
            });
            if (t.getProperty() != null) {
                t.getProperty().setStatus("published");
                propertyRepository.save(t.getProperty());
            }
        }

        if ("broker_confirmed".equals(status)) {
            markSellerPaymentConfirmed(t, currentUser);
            if (t.getProperty() != null) {
                t.getProperty().setStatus("sold");
                propertyRepository.save(t.getProperty());
            }
            commissionRepository.findByTransaction(t).forEach(c -> {
                c.setStatus("paid");
                commissionRepository.save(c);
            });
        }

        if ("cancelled".equals(status)) {
            commissionRepository.findByTransaction(t).forEach(c -> {
                c.setStatus("cancelled");
                commissionRepository.save(c);
            });
            if (t.getProperty() != null) {
                t.getProperty().setStatus("published");
                propertyRepository.save(t.getProperty());
            }
        }

        return convertToDTO(transactionRepository.save(t));
    }

    @Transactional
    public TransactionDTO submitDocuments(Long id, MultipartFile cccd, MultipartFile household, MultipartFile marriage) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch ID: " + id));
        User currentUser = getCurrentUser();
        if (transaction.getCustomer() == null || !transaction.getCustomer().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chỉ khách hàng của giao dịch mới được gửi hồ sơ");
        }
        if (!"customer_confirmed".equals(transaction.getStatus()) && !"documents_submitted".equals(transaction.getStatus())) {
            throw new RuntimeException("Cần xác nhận giao dịch trước khi gửi hồ sơ");
        }
        validateRequiredFile(cccd, "CCCD");
        validateRequiredFile(household, "Sổ hộ khẩu");
        validateRequiredFile(marriage, "Giấy xác nhận hôn nhân");

        transactionDocumentRepository.deleteByTransaction(transaction);
        List<TransactionDocument> documents = new ArrayList<>();
        documents.add(saveDocument(transaction, "cccd", cccd));
        documents.add(saveDocument(transaction, "household", household));
        documents.add(saveDocument(transaction, "marriage", marriage));
        transactionDocumentRepository.saveAll(documents);

        transaction.setStatus("documents_submitted");
        return convertToDTO(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionDTO scheduleDeal(Long id, java.time.LocalDateTime scheduledAt) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich ID: " + id));
        User currentUser = getCurrentUser();
        if (transaction.getCustomer() == null || !transaction.getCustomer().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chi khach hang cua giao dich moi duoc dat lich giao dich");
        }
        if (!"commitment_signed".equals(transaction.getStatus())) {
            throw new RuntimeException("Can hoan thanh cam ket mua hang truoc khi dat lich giao dich");
        }
        if (scheduledAt == null || scheduledAt.isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Thoi gian giao dich phai nam trong tuong lai");
        }

        transaction.setDealScheduleAt(scheduledAt);
        transaction.setStatus("deal_scheduled");
        return convertToDTO(transactionRepository.save(transaction));
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

        if (t.getProperty() != null) {
            dto.setPropertyId(t.getProperty().getPropertyId());
            dto.setPropertyTitle(t.getProperty().getTitle());
            dto.setPropertyCode(t.getProperty().getPropertyCode());
            dto.setPropertyType(t.getProperty().getPropertyType());
            dto.setPropertyProvince(t.getProperty().getProvince());
            dto.setPropertyDistrict(t.getProperty().getDistrict());
            dto.setPropertyArea(t.getProperty().getArea());
            dto.setPropertyPrice(t.getProperty().getPrice());
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
                        document.getUrl()
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

    private void markSellerPaymentConfirmed(Transaction transaction, User broker) {
        List<TransactionPayment> payments = transactionPaymentRepository.findByTransaction(transaction);
        java.math.BigDecimal paidAmount = payments.stream()
                .filter(payment -> !"refunded".equalsIgnoreCase(payment.getPaymentStatus()))
                .map(TransactionPayment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal remainingAmount = transaction.getTotalPrice().subtract(paidAmount);
        if (remainingAmount.signum() <= 0) {
            return;
        }

        TransactionPayment sellerPayment = new TransactionPayment();
        sellerPayment.setTransaction(transaction);
        sellerPayment.setAmount(remainingAmount);
        sellerPayment.setPaymentMethod("transfer");
        sellerPayment.setPaymentStatus("confirmed");
        sellerPayment.setPaymentDate(LocalDate.now());
        sellerPayment.setConfirmedBy(broker);
        transactionPaymentRepository.save(sellerPayment);
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
            document.setUrl(ServletUriComponentsBuilder.fromCurrentContextPath().path("/documents/").path(fileName).toUriString());
            return document;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu hồ sơ: " + e.getMessage());
        }
    }
}

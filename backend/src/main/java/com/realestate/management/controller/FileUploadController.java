package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @Value("${app.upload.base-dir:uploads}")
    private String baseDir;

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "general") String type) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("File không được để trống"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ hỗ trợ file PDF, DOC, DOCX, JPG, PNG"));
            }

            // Validate type folder
            String folderName = switch (type) {
                case "property" -> "property-documents";
                case "customer" -> "customer-documents";
                case "receipt" -> "payment-receipts";
                case "contract" -> "contracts";
                default -> "general";
            };

            String extension = getExtension(file.getOriginalFilename(), contentType);
            String fileName = buildEncodedFileName(file, extension);
            
            Path uploadDir = Paths.get(baseDir, folderName).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            Path targetPath = uploadDir.resolve(fileName).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Tên file không hợp lệ");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath);
            }

            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/" + folderName + "/")
                    .path(fileName)
                    .toUriString();

            return ResponseEntity.ok(ApiResponse.success("Upload file thành công", Map.of("url", url)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload file: " + e.getMessage()));
        }
    }

    private String buildEncodedFileName(MultipartFile file, String extension) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(file.getBytes());
        digest.update(Long.toString(Instant.now().toEpochMilli()).getBytes(StandardCharsets.UTF_8));
        digest.update(UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(digest.digest()) + extension;
    }

    private String getExtension(String originalName, String contentType) {
        String extension = StringUtils.getFilenameExtension(originalName);
        if (extension != null && !extension.isBlank()) {
            return "." + extension.toLowerCase();
        }
        return switch (contentType) {
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case "application/pdf" -> ".pdf";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            default -> ".jpg";
        };
    }
}

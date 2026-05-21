package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
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
public class ImageUploadController {

    private static final String IMAGE_WEBP_VALUE = "image/webp";

    private static final Set<String> ALLOWED_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            MediaType.IMAGE_GIF_VALUE,
            IMAGE_WEBP_VALUE
    );

    @Value("${app.upload.image-dir:images}")
    private String imageDir;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("File ảnh không được để trống"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WEBP"));
            }

            String extension = getExtension(file.getOriginalFilename(), contentType);
            String fileName = buildEncodedFileName(file, extension);
            Path uploadDir = Paths.get(imageDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            Path targetPath = uploadDir.resolve(fileName).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Tên file không hợp lệ"));
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath);
            }

            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/images/")
                    .path(fileName)
                    .toUriString();
            return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", Map.of("url", url)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload ảnh: " + e.getMessage()));
        }
    }

    private String buildEncodedFileName(MultipartFile file, String extension) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(file.getBytes());
        digest.update(Long.toString(Instant.now().toEpochMilli()).getBytes());
        digest.update(UUID.randomUUID().toString().getBytes());
        return HexFormat.of().formatHex(digest.digest()) + extension;
    }

    private String getExtension(String originalName, String contentType) {
        String extension = StringUtils.getFilenameExtension(originalName);
        if (extension != null && !extension.isBlank()) {
            return "." + extension.toLowerCase();
        }
        return switch (contentType) {
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case MediaType.IMAGE_GIF_VALUE -> ".gif";
            case IMAGE_WEBP_VALUE -> ".webp";
            default -> ".jpg";
        };
    }
}

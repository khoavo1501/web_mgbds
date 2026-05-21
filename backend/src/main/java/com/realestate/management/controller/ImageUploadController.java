package com.realestate.management.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.realestate.management.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
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
import java.util.TreeMap;
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

    @Value("${app.upload.provider:local}")
    private String uploadProvider;

    @Value("${app.upload.image-dir:images}")
    private String imageDir;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    @Value("${cloudinary.folder:mgbds/properties}")
    private String cloudinaryFolder;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            ResponseEntity<ApiResponse<Map<String, String>>> invalidResponse = validateImage(file);
            if (invalidResponse != null) {
                return invalidResponse;
            }

            Map<String, String> result = "cloudinary".equalsIgnoreCase(uploadProvider)
                    ? uploadToCloudinary(file)
                    : uploadToLocal(file);

            return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload ảnh: " + e.getMessage()));
        }
    }

    private ResponseEntity<ApiResponse<Map<String, String>>> validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File ảnh không được để trống"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WEBP"));
        }

        return null;
    }

    private Map<String, String> uploadToLocal(MultipartFile file) throws IOException, NoSuchAlgorithmException {
        String contentType = file.getContentType() == null ? MediaType.IMAGE_JPEG_VALUE : file.getContentType();
        String extension = getExtension(file.getOriginalFilename(), contentType);
        String fileName = buildEncodedFileName(file, extension);
        Path uploadDir = Paths.get(imageDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        Path targetPath = uploadDir.resolve(fileName).normalize();
        if (!targetPath.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath);
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/images/")
                .path(fileName)
                .toUriString();

        return Map.of("url", url, "provider", "local");
    }

    private Map<String, String> uploadToCloudinary(MultipartFile file) throws Exception {
        if (cloudinaryCloudName.isBlank() || cloudinaryApiKey.isBlank() || cloudinaryApiSecret.isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình Cloudinary. Hãy cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
        }

        String publicId = buildCloudinaryPublicId(file);
        long timestamp = Instant.now().getEpochSecond();
        String signature = signCloudinaryParams(Map.of(
                "folder", cloudinaryFolder,
                "public_id", publicId,
                "timestamp", Long.toString(timestamp)
        ));

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() == null ? "property-image" : file.getOriginalFilename();
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("api_key", cloudinaryApiKey);
        body.add("timestamp", Long.toString(timestamp));
        body.add("folder", cloudinaryFolder);
        body.add("public_id", publicId);
        body.add("signature", signature);

        String endpoint = "https://api.cloudinary.com/v1_1/" + cloudinaryCloudName + "/image/upload";
        String responseBody = restTemplate.postForObject(endpoint, body, String.class);
        JsonNode json = objectMapper.readTree(responseBody);

        return Map.of(
                "url", json.path("secure_url").asText(),
                "publicId", json.path("public_id").asText(),
                "provider", "cloudinary"
        );
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
            case MediaType.IMAGE_GIF_VALUE -> ".gif";
            case IMAGE_WEBP_VALUE -> ".webp";
            default -> ".jpg";
        };
    }

    private String buildCloudinaryPublicId(MultipartFile file) throws IOException, NoSuchAlgorithmException {
        String originalName = StringUtils.stripFilenameExtension(file.getOriginalFilename());
        String safePrefix = originalName == null || originalName.isBlank()
                ? "property"
                : originalName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(file.getBytes());
        digest.update(UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8));
        String hash = HexFormat.of().formatHex(digest.digest()).substring(0, 24);
        return safePrefix + "-" + hash;
    }

    private String signCloudinaryParams(Map<String, String> params) throws NoSuchAlgorithmException {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        StringBuilder payload = new StringBuilder();

        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            if (!payload.isEmpty()) {
                payload.append("&");
            }
            payload.append(entry.getKey()).append("=").append(entry.getValue());
        }

        payload.append(cloudinaryApiSecret);
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        return HexFormat.of().formatHex(digest.digest(payload.toString().getBytes(StandardCharsets.UTF_8)));
    }
}

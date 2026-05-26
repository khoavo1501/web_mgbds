package com.realestate.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.image-dir:images}")
    private String imageDir;

    @Value("${app.upload.document-dir:documents}")
    private String documentDir;

    @Value("${app.upload.base-dir:uploads}")
    private String uploadBaseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(imageDir).toAbsolutePath().normalize();
        registry
                .addResourceHandler("/images/**")
                .addResourceLocations(uploadPath.toUri().toString());

        Path documentPath = Paths.get(documentDir).toAbsolutePath().normalize();
        registry
                .addResourceHandler("/documents/**")
                .addResourceLocations(documentPath.toUri().toString());
                
        Path uploadBasePath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
        registry
                .addResourceHandler("/uploads/**")
                .addResourceLocations(uploadBasePath.toUri().toString());
    }
}

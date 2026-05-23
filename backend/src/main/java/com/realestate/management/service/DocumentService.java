package com.realestate.management.service;

import com.realestate.management.entity.Property;
import com.realestate.management.entity.PropertyDocument;
import com.realestate.management.entity.Transaction;
import com.realestate.management.entity.TransactionDocument;
import com.realestate.management.entity.User;
import com.realestate.management.repository.PropertyDocumentRepository;
import com.realestate.management.repository.PropertyRepository;
import com.realestate.management.repository.TransactionDocumentRepository;
import com.realestate.management.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentService {

    @Autowired
    private PropertyDocumentRepository propertyDocumentRepository;

    @Autowired
    private TransactionDocumentRepository transactionDocumentRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    public PropertyDocument uploadPropertyDocument(Long propertyId, String type, String fileUrl, User user) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        PropertyDocument doc = new PropertyDocument();
        doc.setProperty(property);
        doc.setDocumentType(type);
        doc.setFileUrl(fileUrl);
        doc.setStatus("pending_review");
        doc.setUploadedBy(user);

        return propertyDocumentRepository.save(doc);
    }

    @Transactional
    public TransactionDocument uploadTransactionDocument(Long transactionId, String type, String fileUrl, User user) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        TransactionDocument doc = new TransactionDocument();
        doc.setTransaction(transaction);
        doc.setDocumentType(type);
        doc.setFileUrl(fileUrl);
        doc.setStatus("pending_review");
        doc.setUploadedBy(user);

        return transactionDocumentRepository.save(doc);
    }

    @Transactional
    public void reviewPropertyDocument(Long documentId, String status, String rejectReason) {
        PropertyDocument doc = propertyDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setStatus(status);
        if ("rejected".equals(status)) {
            doc.setRejectReason(rejectReason);
        } else {
            doc.setRejectReason(null);
        }
        propertyDocumentRepository.save(doc);
    }

    @Transactional
    public void reviewTransactionDocument(Long documentId, String status, String rejectReason) {
        TransactionDocument doc = transactionDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setStatus(status);
        if ("rejected".equals(status)) {
            doc.setRejectReason(rejectReason);
        } else {
            doc.setRejectReason(null);
        }
        transactionDocumentRepository.save(doc);
    }
}

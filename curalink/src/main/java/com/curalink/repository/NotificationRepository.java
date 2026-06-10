package com.curalink.repository;

import com.curalink.model.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

	long countByRecipientIdAndLuFalse(Long recipientId);

	Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

	@Modifying
	@Query("UPDATE Notification n SET n.lu = true WHERE n.recipient.id = :recipientId AND n.lu = false")
	int markAllAsReadForRecipient(@Param("recipientId") Long recipientId);
}

package com.curalink.repository;

import com.curalink.model.catalog.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceItemRepository extends JpaRepository<ServiceItem, Long> {
	List<ServiceItem> findAllByOrderByNomAsc();
}

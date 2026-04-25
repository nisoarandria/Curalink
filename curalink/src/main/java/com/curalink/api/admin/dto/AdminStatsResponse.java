package com.curalink.api.admin.dto;

public record AdminStatsResponse(
		long nombreStaffMedical,
		long nombrePatients,
		long nombreServices,
		long nombreRendezVousConfirmes
) {
}

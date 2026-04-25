package com.curalink.api.nutrition.dto;

import java.util.List;

public record ArticleListResponse(
		String description,
		List<ArticleResponse> content,
		int page,
		int size,
		long totalElements,
		int totalPages
) {
}

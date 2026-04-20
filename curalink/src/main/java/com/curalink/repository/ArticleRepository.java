package com.curalink.repository;

import com.curalink.model.nutrition.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long>, JpaSpecificationExecutor<Article> {

	@Query("SELECT a FROM Article a JOIN FETCH a.rubrique JOIN FETCH a.auteur WHERE a.id = :id")
	Optional<Article> findDetailById(@Param("id") Long id);
}

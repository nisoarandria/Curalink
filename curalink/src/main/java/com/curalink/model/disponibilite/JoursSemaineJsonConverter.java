package com.curalink.model.disponibilite;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.EnumSet;
import java.util.Set;

@Converter
public class JoursSemaineJsonConverter implements AttributeConverter<Set<JourSemaine>, String> {

	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	@Override
	public String convertToDatabaseColumn(Set<JourSemaine> attribute) {
		Set<JourSemaine> safe;
		if (attribute == null || attribute.isEmpty()) {
			safe = EnumSet.noneOf(JourSemaine.class);
		} else {
			safe = EnumSet.copyOf(attribute);
		}
		try {
			return OBJECT_MAPPER.writeValueAsString(safe);
		} catch (JsonProcessingException e) {
			throw new IllegalArgumentException("Impossible de sérialiser jours_semaine", e);
		}
	}

	@Override
	public Set<JourSemaine> convertToEntityAttribute(String dbData) {
		if (dbData == null || dbData.isBlank()) {
			return EnumSet.noneOf(JourSemaine.class);
		}
		try {
			Set<JourSemaine> parsed = OBJECT_MAPPER.readValue(dbData, new TypeReference<>() {
			});
			return parsed.isEmpty() ? EnumSet.noneOf(JourSemaine.class) : EnumSet.copyOf(parsed);
		} catch (JsonProcessingException e) {
			throw new IllegalArgumentException("Impossible de lire jours_semaine", e);
		}
	}
}

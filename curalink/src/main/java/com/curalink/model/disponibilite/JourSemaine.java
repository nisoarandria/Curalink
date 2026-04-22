package com.curalink.model.disponibilite;

import java.time.DayOfWeek;

public enum JourSemaine {
	LUN(DayOfWeek.MONDAY),
	MAR(DayOfWeek.TUESDAY),
	MER(DayOfWeek.WEDNESDAY),
	JEU(DayOfWeek.THURSDAY),
	VEN(DayOfWeek.FRIDAY),
	SAM(DayOfWeek.SATURDAY),
	DIM(DayOfWeek.SUNDAY);

	private final DayOfWeek dayOfWeek;

	JourSemaine(DayOfWeek dayOfWeek) {
		this.dayOfWeek = dayOfWeek;
	}

	public boolean matches(DayOfWeek value) {
		return this.dayOfWeek == value;
	}
}

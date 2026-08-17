export function startOfDay(date: Date): number {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export function endOfDay(date: Date): number {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d.getTime();
}

export function formatDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function parseDateKey(dateKey: string): Date | null {
	const parts = dateKey.split('-').map(Number);
	const year = parts[0];
	const month = parts[1];
	const day = parts[2];
	if (!year || !month || !day) return null;
	return new Date(year, month - 1, day);
}

/** Week starts on Sunday (matches 日一二三四五六 header). */
export function startOfWeek(date: Date): Date {
	const d = new Date(date);
	const weekday = d.getDay();
	d.setDate(d.getDate() - weekday);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function endOfWeek(weekStart: Date): Date {
	const d = new Date(weekStart);
	d.setDate(d.getDate() + 6);
	d.setHours(23, 59, 59, 999);
	return d;
}

export function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

export function isBeforeDay(a: Date, b: Date): boolean {
	return startOfDay(a) < startOfDay(b);
}

export function isAfterDay(a: Date, b: Date): boolean {
	return startOfDay(a) > startOfDay(b);
}

export function formatWeekRange(weekStart: Date): string {
	const weekEnd = addDays(weekStart, 6);
	const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
	if (sameMonth) {
		return `${weekStart.getFullYear()} 年 ${weekStart.getMonth() + 1} 月 ${weekStart.getDate()}–${weekEnd.getDate()} 日`;
	}
	return `${weekStart.getFullYear()} 年 ${weekStart.getMonth() + 1}/${weekStart.getDate()} – ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
}

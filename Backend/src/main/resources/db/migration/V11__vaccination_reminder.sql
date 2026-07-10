-- V11: nhắc lịch tiêm — ghi ngày đã nhắc gần nhất để không spam thông báo
ALTER TABLE vaccinations ADD COLUMN last_reminded_on DATE;

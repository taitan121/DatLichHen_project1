package com.skincare.booking.controller;

import com.skincare.booking.dto.AgentRequest;
import com.skincare.booking.dto.AgentResponse;
import com.skincare.booking.entity.ServiceItem;
import com.skincare.booking.entity.TimeSlot;
import com.skincare.booking.repository.ServiceItemRepository;
import com.skincare.booking.repository.TimeSlotRepository;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
public class AgentController {
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

    private static final List<SimpleSlot> DEFAULT_SLOTS = List.of(
            new SimpleSlot("09:00", "10:00"),
            new SimpleSlot("10:30", "11:30"),
            new SimpleSlot("14:00", "15:00"),
            new SimpleSlot("15:30", "16:30")
    );

    private final ServiceItemRepository serviceRepository;
    private final TimeSlotRepository timeSlotRepository;

    public AgentController(ServiceItemRepository serviceRepository, TimeSlotRepository timeSlotRepository) {
        this.serviceRepository = serviceRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    @PostMapping("/chat")
    public AgentResponse chat(@RequestBody AgentRequest request) {
        String message = normalize(request.getMessage());

        if (message.isBlank()) {
            return new AgentResponse("Bạn hãy nhập câu hỏi về dịch vụ, giá hoặc lịch trống nhé.");
        }

        if (hasAny(message, "lich", "gio", "trong", "available", "hom nay", "ngay mai")) {
            return new AgentResponse(replyAvailableSlots(message));
        }

        if (message.contains("gia")) {
            ServiceItem service = findServiceByMessage(message);
            if (service == null) {
                return new AgentResponse("Bạn muốn hỏi giá dịch vụ nào? Hiện chatbot có thể xem giá các dịch vụ đang có trong hệ thống.");
            }
            return new AgentResponse(service.getName() + " có giá " + formatPrice(service.getPrice())
                    + " đ, thời lượng khoảng " + service.getDurationMinutes() + " phút.");
        }

        if (message.contains("mun")) {
            return new AgentResponse(replyServiceSuggestion("mun", "Nếu bạn gặp vấn đề về mụn, bạn có thể chọn "));
        }

        if (hasAny(message, "trang", "duong trang")) {
            return new AgentResponse(replyServiceSuggestion("trang", "Nếu bạn muốn da sáng và đều màu hơn, bạn có thể chọn "));
        }

        if (message.contains("co ban")) {
            return new AgentResponse(replyServiceSuggestion("co ban", "Nếu bạn muốn chăm sóc da nhẹ nhàng, bạn có thể chọn "));
        }

        if (hasAny(message, "dich vu", "service", "co gi")) {
            return new AgentResponse(replyServices());
        }

        return new AgentResponse("Mình có thể tư vấn dịch vụ chăm sóc da, xem giá dịch vụ và kiểm tra khung giờ còn trống cho bạn.");
    }

    private String replyServices() {
        List<ServiceItem> services = serviceRepository.findAll();
        if (services.isEmpty()) {
            return "Hiện chưa có dịch vụ nào trong hệ thống.";
        }

        StringBuilder reply = new StringBuilder("Các dịch vụ hiện có:\n");
        for (ServiceItem service : services) {
            reply.append("- ")
                    .append(service.getName())
                    .append(": ")
                    .append(formatPrice(service.getPrice()))
                    .append(" đ, ")
                    .append(service.getDurationMinutes())
                    .append(" phút\n");
        }
        return reply.toString().trim();
    }

    private String replyAvailableSlots(String message) {
        String askedDate = getAskedDate(message);
        if (askedDate != null) {
            return replyAvailableSlotsByDate(askedDate);
        }

        return "Bạn muốn xem khung giờ trống ngày nào? Bạn có thể nhập ví dụ: hôm nay, ngày mai hoặc 2026-05-31.";
    }

    private String replyAvailableSlotsByDate(String date) {
        List<TimeSlot> savedSlots = timeSlotRepository.findBySlotDate(date);
        List<SimpleSlot> availableSlots = DEFAULT_SLOTS.stream()
                .filter(defaultSlot -> isDefaultSlotAvailable(defaultSlot, savedSlots))
                .toList();

        if (availableSlots.isEmpty()) {
            return "Ngày " + date + " hiện không còn khung giờ trống.";
        }

        StringBuilder reply = new StringBuilder("Các khung giờ còn trống ngày " + date + ":\n");
        for (SimpleSlot slot : availableSlots) {
            reply.append("- ")
                    .append(slot.startTime())
                    .append(" - ")
                    .append(slot.endTime())
                    .append("\n");
        }
        return reply.toString().trim();
    }

    private boolean isDefaultSlotAvailable(SimpleSlot defaultSlot, List<TimeSlot> savedSlots) {
        return savedSlots.stream()
                .filter(slot -> shortTime(slot.getStartTime()).equals(defaultSlot.startTime()))
                .findFirst()
                .map(slot -> Boolean.TRUE.equals(slot.getAvailable()))
                .orElse(true);
    }

    private String getAskedDate(String message) {
        Matcher matcher = ISO_DATE_PATTERN.matcher(message);
        if (matcher.find()) {
            return matcher.group();
        }
        if (message.contains("hom nay")) {
            return LocalDate.now().toString();
        }
        if (message.contains("ngay mai")) {
            return LocalDate.now().plusDays(1).toString();
        }
        return null;
    }

    private String replyServiceSuggestion(String keyword, String intro) {
        ServiceItem service = findServiceByKeyword(keyword);
        if (service == null) {
            return "Mình chưa tìm thấy dịch vụ phù hợp trong database. Bạn có thể hỏi: Có dịch vụ nào?";
        }

        return intro + service.getName() + ". " + safeText(service.getDescription())
                + " Giá dịch vụ là " + formatPrice(service.getPrice()) + " đ.";
    }

    private ServiceItem findServiceByMessage(String message) {
        for (ServiceItem service : serviceRepository.findAll()) {
            if (message.contains(normalize(service.getName()))) {
                return service;
            }
        }

        if (message.contains("mun")) return findServiceByKeyword("mun");
        if (message.contains("trang")) return findServiceByKeyword("trang");
        if (message.contains("co ban")) return findServiceByKeyword("co ban");
        return null;
    }

    private ServiceItem findServiceByKeyword(String keyword) {
        return serviceRepository.findAll()
                .stream()
                .filter(service -> normalize(service.getName()).contains(keyword)
                        || normalize(service.getDescription()).contains(keyword))
                .findFirst()
                .orElse(null);
    }

    private boolean hasAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) return true;
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) return "";
        String noAccent = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "D");
        return noAccent.toLowerCase(Locale.ROOT).trim();
    }

    private String formatPrice(Double price) {
        return String.format(Locale.forLanguageTag("vi-VN"), "%,.0f", price == null ? 0 : price);
    }

    private String shortTime(String time) {
        return time == null ? "" : time.substring(0, Math.min(5, time.length()));
    }

    private String safeText(String text) {
        return text == null || text.isBlank() ? "" : text;
    }

    private record SimpleSlot(String startTime, String endTime) {
    }
}

package net.dima.dima5_project.service.chat;

public class GuestContext {
    private static final ThreadLocal<String> TL = new ThreadLocal<>();

    public static void set(String guestId) {
        TL.set(guestId);
    }

    public static String get() {
        return TL.get();
    }

    public static void clear() {
        TL.remove();
    }
}

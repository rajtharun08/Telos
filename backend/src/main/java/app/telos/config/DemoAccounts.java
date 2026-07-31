package app.telos.config;

import java.util.Set;

/** Stable IDs created only for the local demonstration dataset. */
public final class DemoAccounts {

    public static final String ADMIN_ID = "u-001";
    public static final Set<String> IDS =
            Set.of("u-001", "u-101", "u-102", "u-103", "u-104", "u-105");

    private DemoAccounts() {}

    public static boolean contains(String userId) {
        return IDS.contains(userId);
    }
}

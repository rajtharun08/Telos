package app.telos.transaction.dto;

/** Compact wallet balance echo returned alongside a freshly created transaction. */
public record WalletEcho(double available, double locked) {}

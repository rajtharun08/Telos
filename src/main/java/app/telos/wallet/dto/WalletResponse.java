package app.telos.wallet.dto;

import java.util.List;

public record WalletResponse(
        double available,
        double locked,
        double earned,
        double pendingClear,
        List<LedgerEntryDto> ledger
) {}

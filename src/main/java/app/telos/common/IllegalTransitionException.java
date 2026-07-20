package app.telos.common;

/** Thrown when a transaction transition violates the state machine. -> 409. */
public class IllegalTransitionException extends RuntimeException {
    private final String from;
    private final String to;

    public IllegalTransitionException(String from, String to) {
        super("Illegal transition " + from + " -> " + to);
        this.from = from;
        this.to = to;
    }

    public String getFrom() { return from; }
    public String getTo() { return to; }
}

export const idempotencyHeaders = () => ({ "Idempotency-Key": crypto.randomUUID() });

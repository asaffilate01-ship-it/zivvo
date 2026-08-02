export const TERMINAL_RESERVATION_STATUSES = new Set(["expired", "refunded", "applied_to_sale", "cancelled"]);

export const isReservationActionable = (status: string) => status === "paid";

export const reservationRemaining = (expiresAt: string | null, now = Date.now()) => {
  if (!expiresAt) return null;
  const milliseconds = new Date(expiresAt).getTime() - now;
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  return {
    expired: milliseconds <= 0,
    totalMinutes,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
};

export const reservationNeedsAttention = (status: string, expiresAt: string | null, now = Date.now()) => {
  const remaining = reservationRemaining(expiresAt, now);
  return status === "refund_failed" || status === "expiry_processing" || (status === "paid" && Boolean(remaining && remaining.totalMinutes <= 360));
};

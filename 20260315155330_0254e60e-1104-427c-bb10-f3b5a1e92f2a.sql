import { HttpError, json, parseJson, preflight, requirePost, requireUser, requireUuid, safeError } from "../_shared/security.ts";

interface ChecklistEntry { result: string; notes?: string; photo_url?: string }

const SECTIONS = [
  { id: "exterior", title: "Karosserie & Außenbereich" },
  { id: "interior", title: "Innenraum" },
  { id: "engine", title: "Motorraum" },
  { id: "transmission", title: "Getriebe & Kupplung" },
  { id: "brakes", title: "Bremsen" },
  { id: "suspension", title: "Fahrwerk & Lenkung" },
  { id: "electrics", title: "Elektrik & Elektronik" },
  { id: "ac_heat", title: "Klima & Heizung" },
  { id: "tyres", title: "Räder & Reifen" },
  { id: "underbody", title: "Unterboden & Fahrgestell" },
  { id: "road_test", title: "Probefahrt" },
  { id: "documents", title: "Dokumente & Historie" },
];

const RESULT_COLORS: Record<string, string> = {
  pass: "#16a34a", advisory: "#f59e0b", fail: "#dc2626", na: "#6b7280",
};

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildHtml(payload: any): string {
  const { booking, scorecard, listing, inspector } = payload;
  const checklist: Record<string, ChecklistEntry> = scorecard.checklist || {};

  const sectionsHtml = SECTIONS.map((sec) => {
    const items = Object.entries(checklist).filter(([k]) => k.startsWith(sec.id.split("_")[0].slice(0, 3)));
    if (items.length === 0) return "";
    const rows = items.map(([k, e]) => `
      <tr>
        <td>${escapeHtml(k)}</td>
        <td><span style="background:${RESULT_COLORS[e.result] || "#999"};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${escapeHtml(e.result?.toUpperCase())}</span></td>
        <td>${escapeHtml(e.notes || "")}</td>
      </tr>`).join("");
    return `
      <h3 style="margin-top:20px;color:#7c3aed;border-bottom:2px solid #7c3aed;padding-bottom:4px;">${escapeHtml(sec.title)}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f3f4f6;"><th style="text-align:left;padding:6px;">Item</th><th style="text-align:left;padding:6px;width:90px;">Result</th><th style="text-align:left;padding:6px;">Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }).join("");

  const grade = scorecard.grade || "—";
  const score = scorecard.score || 0;
  const total = scorecard.total_points || 200;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const gradeColor = grade === "A" ? "#16a34a" : grade === "B" ? "#22c55e" : grade === "C" ? "#f59e0b" : grade === "D" ? "#f97316" : "#dc2626";

  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Prüfbericht ${escapeHtml(listing.registration || "")}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:800px;margin:0 auto;padding:24px;}
  .header{display:flex;justify-content:space-between;align-items:start;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:20px;}
  .brand{font-size:28px;font-weight:bold;color:#7c3aed;}
  .grade-box{background:${gradeColor};color:white;padding:16px 24px;border-radius:8px;text-align:center;}
  .grade{font-size:42px;font-weight:bold;line-height:1;}
  .meta{background:#f9fafb;padding:12px;border-radius:6px;margin:12px 0;font-size:13px;}
  .meta strong{color:#7c3aed;}
  .summary-box{background:#f3f4f6;padding:14px;border-radius:6px;margin:16px 0;font-size:13px;}
  .footer{margin-top:30px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;}
</style></head>
<body>
  <div class="header">
    <div>
      <div class="brand">Zivvo</div>
      <div style="color:#666;font-size:14px;">Fahrzeug-Prüfbericht</div>
      <div style="color:#999;font-size:11px;">Berichts-ID: ${escapeHtml(scorecard.id)}</div>
    </div>
    <div class="grade-box">
      <div class="grade">${escapeHtml(grade)}</div>
      <div style="font-size:14px;">${score}/${total}</div>
      <div style="font-size:11px;opacity:.9;">${pct}%</div>
    </div>
  </div>

  <div class="meta">
    <div><strong>Fahrzeug:</strong> ${escapeHtml(listing.year)} ${escapeHtml(listing.make)} ${escapeHtml(listing.model)}</div>
    <div><strong>Kennzeichen:</strong> ${escapeHtml(listing.registration || "—")} &nbsp;|&nbsp; <strong>FIN:</strong> ${escapeHtml(listing.vin || "—")}</div>
    <div><strong>Kilometerstand:</strong> ${listing.mileage ? listing.mileage.toLocaleString("de-DE") : "—"} km</div>
    <div><strong>Geprüft:</strong> ${escapeHtml(new Date(scorecard.submitted_at || scorecard.updated_at).toLocaleString("de-DE"))}</div>
    <div><strong>Prüfer:</strong> ${escapeHtml(inspector?.full_name || "Zivvo Prüfer")}</div>
  </div>

  ${scorecard.recommendation ? `<div class="summary-box"><strong>Empfehlung:</strong><br>${escapeHtml(scorecard.recommendation)}</div>` : ""}
  ${scorecard.overall_notes ? `<div class="summary-box"><strong>Gesamthinweise:</strong><br>${escapeHtml(scorecard.overall_notes)}</div>` : ""}

  <h2 style="color:#7c3aed;margin-top:24px;">Prüfergebnisse</h2>
  ${sectionsHtml}

  <div class="footer">
    Zivvo Fahrzeugprüfung · Zustandsaufnahme zum Zeitpunkt der Prüfung, keine Beschaffenheitsgarantie.<br>
    Erstellt am ${new Date().toLocaleString("de-DE")}
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const options = preflight(req); if (options) return options;
    requirePost(req);
    const { user, admin: supabase } = await requireUser(req);
    const body = await parseJson(req);
    const booking_id = requireUuid(body.booking_id, "booking_id");
    const scorecard_id = requireUuid(body.scorecard_id, "scorecard_id");

    const [{ data: booking }, { data: scorecard }] = await Promise.all([
      supabase.from("inspection_bookings").select("*, car_listings(*)").eq("id", booking_id).maybeSingle(),
      supabase.from("inspection_scorecards").select("*").eq("id", scorecard_id).maybeSingle(),
    ]);
    if (!booking || !scorecard) throw new HttpError(404, "Inspection not found");
    if (booking.inspector_id !== user.id || scorecard.inspector_id !== user.id || scorecard.booking_id !== booking.id) throw new HttpError(403, "Assigned inspector access required");
    if (!scorecard.submitted_at) throw new HttpError(409, "Submit the scorecard first");
    if (booking.status === "completed" && booking.report_url) return json(req, { success: true, report_url: booking.report_url, already_completed: true });
    if (!["scheduled", "in_progress"].includes(booking.status)) throw new HttpError(409, "Inspection cannot be completed from its current state");

    const { data: inspector } = await supabase.from("inspector_profiles").select("*").eq("user_id", scorecard.inspector_id).maybeSingle();

    const html = buildHtml({ booking, scorecard, listing: booking.car_listings, inspector });

    // Upload HTML report (browsers can print-to-PDF; this avoids heavy PDF deps in Deno)
    const reportPath = `inspections/${booking_id}/report-${scorecard_id}.html`;
    const { error: upErr } = await supabase.storage.from("listing-documents").upload(reportPath, new Blob([html], { type: "text/html" }), { upsert: true });
    if (upErr) throw upErr;

    const { data: claimed, error: claimError } = await supabase.from("inspection_bookings").update({
      status: "completed", completed_at: new Date().toISOString(),
      score: scorecard.score, report_url: reportPath,
    }).eq("id", booking_id).in("status", ["scheduled", "in_progress"]).select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return json(req, { success: true, report_url: reportPath, already_completed: true });
    const scorecardUpdate = await supabase.from("inspection_scorecards").update({ pdf_url: reportPath }).eq("id", scorecard_id);
    const listingUpdate = await supabase.from("car_listings").update({
      inspection_score: scorecard.score, inspection_report_url: reportPath,
      inspection_completed_at: new Date().toISOString(),
    }).eq("id", booking.listing_id);
    if (scorecardUpdate.error || listingUpdate.error) throw scorecardUpdate.error || listingUpdate.error;

    // Increment inspector counter
    if (inspector) {
      const { error } = await supabase.rpc("increment_inspector_completed", { p_user_id: user.id });
      if (error) throw error;
    }

    // Notify buyer & seller
    await supabase.from("notifications").insert([
      { user_id: booking.buyer_id, type: "inspection", title: "Prüfbericht verfügbar",
        message: `Die Fahrzeugprüfung ist abgeschlossen. Ergebnis: ${scorecard.score}/${scorecard.total_points} (Note ${scorecard.grade}).`,
        link: `/car/${booking.listing_id}` },
      { user_id: booking.seller_id, type: "inspection", title: "Fahrzeugprüfung abgeschlossen",
        message: `Die Prüfung Ihres Inserats ist abgeschlossen (Note ${scorecard.grade}).`,
        link: `/car/${booking.listing_id}` },
    ]);

    return json(req, { success: true, report_url: reportPath });
  } catch (error) {
    return safeError(req, error);
  }
});

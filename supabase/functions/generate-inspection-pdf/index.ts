import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface ChecklistEntry { result: string; notes?: string; photo_url?: string }

const SECTIONS = [
  { id: "exterior", title: "Exterior & Bodywork" },
  { id: "interior", title: "Interior & Trim" },
  { id: "engine", title: "Engine Bay" },
  { id: "transmission", title: "Transmission & Clutch" },
  { id: "brakes", title: "Brakes" },
  { id: "suspension", title: "Suspension & Steering" },
  { id: "electrics", title: "Electrics & Electronics" },
  { id: "ac_heat", title: "Climate & Heating" },
  { id: "tyres", title: "Wheels & Tyres" },
  { id: "underbody", title: "Underbody & Chassis" },
  { id: "road_test", title: "Road Test" },
  { id: "documents", title: "Documents & History" },
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
<html><head><meta charset="utf-8"><title>Inspection Report ${escapeHtml(listing.registration || "")}</title>
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
      <div style="color:#666;font-size:14px;">200-Point Vehicle Inspection Report</div>
      <div style="color:#999;font-size:11px;">Report ID: ${escapeHtml(scorecard.id)}</div>
    </div>
    <div class="grade-box">
      <div class="grade">${escapeHtml(grade)}</div>
      <div style="font-size:14px;">${score}/${total}</div>
      <div style="font-size:11px;opacity:.9;">${pct}%</div>
    </div>
  </div>

  <div class="meta">
    <div><strong>Vehicle:</strong> ${escapeHtml(listing.year)} ${escapeHtml(listing.make)} ${escapeHtml(listing.model)}</div>
    <div><strong>Registration:</strong> ${escapeHtml(listing.registration || "—")} &nbsp;|&nbsp; <strong>VIN:</strong> ${escapeHtml(listing.vin || "—")}</div>
    <div><strong>Mileage:</strong> ${listing.mileage ? listing.mileage.toLocaleString() : "—"} miles</div>
    <div><strong>Inspected:</strong> ${escapeHtml(new Date(scorecard.submitted_at || scorecard.updated_at).toLocaleString("en-GB"))}</div>
    <div><strong>Inspector:</strong> ${escapeHtml(inspector?.full_name || "Zivvo Inspector")} ${inspector?.qualifications ? `(${escapeHtml(inspector.qualifications)})` : ""}</div>
  </div>

  ${scorecard.recommendation ? `<div class="summary-box"><strong>Recommendation:</strong><br>${escapeHtml(scorecard.recommendation)}</div>` : ""}
  ${scorecard.overall_notes ? `<div class="summary-box"><strong>Overall notes:</strong><br>${escapeHtml(scorecard.overall_notes)}</div>` : ""}

  <h2 style="color:#7c3aed;margin-top:24px;">Detailed Findings</h2>
  ${sectionsHtml}

  <div class="footer">
    Zivvo Vehicle Inspection · This report represents the inspector's professional opinion at the time of inspection.<br>
    It does not constitute a guarantee. Generated ${new Date().toLocaleString("en-GB")}
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { booking_id, scorecard_id } = await req.json();
    if (!booking_id || !scorecard_id) {
      return new Response(JSON.stringify({ error: "booking_id and scorecard_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: booking }, { data: scorecard }] = await Promise.all([
      supabase.from("inspection_bookings").select("*, car_listings(*)").eq("id", booking_id).maybeSingle(),
      supabase.from("inspection_scorecards").select("*").eq("id", scorecard_id).maybeSingle(),
    ]);
    if (!booking || !scorecard) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: inspector } = await supabase.from("inspector_profiles").select("*").eq("user_id", scorecard.inspector_id).maybeSingle();

    const html = buildHtml({ booking, scorecard, listing: booking.car_listings, inspector });

    // Upload HTML report (browsers can print-to-PDF; this avoids heavy PDF deps in Deno)
    const reportPath = `inspections/${booking_id}/report-${Date.now()}.html`;
    const { error: upErr } = await supabase.storage.from("listing-documents").upload(reportPath, new Blob([html], { type: "text/html" }), { upsert: true });
    if (upErr) throw upErr;

    // Mark booking + listing
    await supabase.from("inspection_scorecards").update({ pdf_url: reportPath }).eq("id", scorecard_id);
    await supabase.from("inspection_bookings").update({
      status: "completed", completed_at: new Date().toISOString(),
      score: scorecard.score, report_url: reportPath,
    }).eq("id", booking_id);
    await supabase.from("car_listings").update({
      inspection_score: scorecard.score, inspection_report_url: reportPath,
      inspection_completed_at: new Date().toISOString(),
    }).eq("id", booking.listing_id);

    // Increment inspector counter
    if (inspector) {
      await supabase.from("inspector_profiles").update({
        total_inspections: (inspector.total_inspections || 0) + 1,
      }).eq("id", inspector.id);
    }

    // Notify buyer & seller
    await supabase.from("notifications").insert([
      { user_id: booking.buyer_id, type: "inspection", title: "Inspection report ready 📋",
        message: `Your inspection is complete. Score: ${scorecard.score}/${scorecard.total_points} (Grade ${scorecard.grade})`,
        link: `/car/${booking.listing_id}` },
      { user_id: booking.seller_id, type: "inspection", title: "Inspection completed",
        message: `An inspection on your listing is complete (Grade ${scorecard.grade}).`,
        link: `/car/${booking.listing_id}` },
    ]);

    return new Response(JSON.stringify({ success: true, report_url: reportPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

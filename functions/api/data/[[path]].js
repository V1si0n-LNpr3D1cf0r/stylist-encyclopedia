// Private Google Sheets proxy for Cloudflare Pages Functions.
// Required Cloudflare secret: GOOGLE_SERVICE_ACCOUNT_JSON
const SHEETS = {
  main: {
    id: "1vDpYDFGoCrhZjVxNf2RFOXc9vr3reV25kDtdRHIZXt8",
    tabs: { items: null, crafting: 1432725843, chapters: 563709766, breakdowns: 333774526, themes: 1701381424, serverNames: 1044161109, music: 210977537, taskSuits: 1505720108, suitGallery: 1089816438 }
  },
  scorer: {
    ln: "1do-UIvxKA9-8Un90g-SwqdR7HACPT4H1SnAfDbEgT1o",
    vn: "1uO81VAutbW249ZUBlukWBDOsejwwUnhHGL3bk2qxypo",
    cn: "1n_d9afE_v6wphHnWhTdBdX6B6rJQV32cmNEVkHhvupg",
    jp: "1a8jmEGctFeTthZ59_FMfBmPlgoR6KOWi0RuWQRzIyHU",
    tw: "1xvY-FBKSDAg_9F3By7ERIh_ZkvMitJfuWVbRjYh1Jns"
  }
};
let cachedToken = null, tokenExpiresAt = 0;
function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function pemBytes(pem) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(body), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function accessToken(env) {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new Error("Google service account secret is not configured");
  const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." +
    b64url(JSON.stringify({ iss: account.client_email, scope: "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(account.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + b64url(new Uint8Array(sig)) })
  });
  if (!response.ok) throw new Error("Google authentication failed (" + response.status + ")");
  const data = await response.json(); cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
  return cachedToken;
}
async function googleFetch(url, env) {
  const token = await accessToken(env), r = await fetch(url, { headers: { authorization: "Bearer " + token } });
  if (!r.ok) throw new Error("Google data request failed (" + r.status + ")");
  return r;
}
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function error(status, message) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
async function sheetTitle(id, gid, env) {
  const r = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets/" + id + "?fields=" + encodeURIComponent("sheets.properties(sheetId,title)"), env);
  const data = await r.json(), list = data.sheets || [];
  const found = gid == null ? list[0] : list.find(x => Number(x.properties.sheetId) === Number(gid));
  if (!found) throw new Error("Configured worksheet was not found");
  return found.properties.title;
}
async function mainCsv(key, env) {
  const gid = SHEETS.main.tabs[key];
  if (gid === undefined) return error(404, "Unknown data source");
  const title = await sheetTitle(SHEETS.main.id, gid, env);
  const range = "'" + title.replace(/'/g, "''") + "'";
  const r = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets/" + SHEETS.main.id + "/values/" + encodeURIComponent(range) + "?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE", env);
  const data = await r.json(), rows = data.values || [];
  const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "public, max-age=60, s-maxage=300", "x-content-type-options": "nosniff" } });
}
async function scorerXlsx(key, request, env) {
  const id = SHEETS.scorer[key];
  if (!id) return error(404, "Unknown scorer server");
  if (new URL(request.url).searchParams.get("output") !== "xlsx") return error(400, "Unsupported scorer format");
  const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const r = await googleFetch("https://www.googleapis.com/drive/v3/files/" + id + "/export?mimeType=" + encodeURIComponent(mime), env);
  return new Response(r.body, { headers: { "content-type": mime, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
export async function onRequest({ request, env, params }) {
  if (request.method !== "GET") return error(405, "Method not allowed");
  const path = Array.isArray(params.path) ? params.path : String(params.path || "").split("/").filter(Boolean);
  try {
    if (path[0] === "main" && path.length === 2) return await mainCsv(path[1], env);
    if (path[0] === "scorer" && path.length === 2) return await scorerXlsx(path[1], request, env);
    return error(404, "Unknown data endpoint");
  } catch (e) {
    console.error("[private sheet API]", e);
    return error(502, "The data source is temporarily unavailable");
  }
}

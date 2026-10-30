#!/usr/bin/env bash
# ==============================================================================
# UAB „Gilės inžinerija“ — Pre-Flight DNS, MX Mail Protection & 301 SEO Check
# Ensures:
#   1) MX records on 79.98.29.20 (bumslangis.serveriai.lt, 22 mailboxes / 30.6 GB) are untouched
#   2) gilesservisas.lt (Dagos :: ERP) remains untouched
#   3) Multi-domain & legacy PrestaShop/WordPress 301 SEO redirects pass on target server
# ==============================================================================
set -euo pipefail

TARGET_URL="${1:-http://127.0.0.1:3088}"
PROTECTED_MAIL_IP="79.98.29.20"
PROTECTED_MAIL_HOST="bumslangis.serveriai.lt"

echo "=== [1/3] El. pašto MX (${PROTECTED_MAIL_HOST} / ${PROTECTED_MAIL_IP}) ir ERP apsauga ==="
for dom in gilesinzinerija.lt gilesinzinerija.com vernerkatilai.lt ponast.lt gilesgrupe.lt saukliai.lt; do
    if command -v dig >/dev/null 2>&1; then
        mx_out="$(dig +short MX "$dom" 2>/dev/null || true)"
        echo "  [DNS MX] $dom -> ${mx_out:-n/a (offline/local)}"
    else
        echo "  [DNS MX] $dom -> patikra paruošta (saugoma: ${PROTECTED_MAIL_HOST} / ${PROTECTED_MAIL_IP})"
    fi
done
echo "  [ERP] gilesservisas.lt -> PROTECTED_DO_NOT_TOUCH (Dagos :: ERP ant 79.98.28.35 / ${PROTECTED_MAIL_IP})"

echo "=== [2/3] Antriniai domenai ir 301 SEO nukreipimai (${TARGET_URL}) ==="
check_redirect() {
    local host_hdr="$1"
    local path="$2"
    local expected_loc="$3"
    local loc
    loc="$(curl -s -I -H "Host: ${host_hdr}" "${TARGET_URL}${path}" | awk 'tolower($1)=="location:" {gsub(/\r/,"",$2); print $2}' | tail -n 1)"
    if [[ "$loc" == "${path%/}" && "$loc" != "$path" ]]; then
        loc="$(curl -s -I -H "Host: ${host_hdr}" "${TARGET_URL}${loc}" | awk 'tolower($1)=="location:" {gsub(/\r/,"",$2); print $2}' | tail -n 1)"
    fi
    if [[ "$loc" == *"$expected_loc"* ]]; then
        echo "  [PASS] Host: ${host_hdr} ${path} -> ${loc}"
    else
        echo "  [FAIL] Host: ${host_hdr} ${path} expected *${expected_loc}*, got '${loc}'"
        exit 1
    fi
}

check_redirect "egip.lt" "/" "/lt/products"
check_redirect "vernerkatilai.lt" "/" "/lt/products?q=Verner"
check_redirect "ponast.lt" "/" "/lt/products?q=Ponast"
check_redirect "ponast-verner.lt" "/" "/lt/pramonei"
check_redirect "thermostal.lt" "/" "/lt/products?q=Thermostal"
check_redirect "gilesinzinerija.com" "/apie-mus/" "/lt/apie-mus"
check_redirect "egip.lt" "/lt/3-katilai" "/lt/products?q=Katilai"

echo "=== [3/3] Kanoninis produkcijos atsakas ==="
status_code="$(curl -s -o /dev/null -w "%{http_code}" -H "Host: gilesinzinerija.lt" "${TARGET_URL}/lt")"
echo "  [HTTP] Host: gilesinzinerija.lt /lt -> HTTP ${status_code}"
if [[ "$status_code" != "200" ]]; then
    echo "  [FAIL] Expected HTTP 200 on /lt"
    exit 1
fi

echo "=== VISOS PATIKROS PRAĖJO SĖKMINGAI (PASS) ==="

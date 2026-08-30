"""Notifikasi email lead via integrasi email terkelola Emergent."""
import ipaddress
import logging
import os
import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("byd")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "BYD BIPO Serpong")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None):
    """Kirim email. `html` selalu berasal dari template server-side."""
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY belum diset — notifikasi email dilewati")
        return None
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                     headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as exc:
        logger.error("Notifikasi email gagal: %s", exc)
        return None


def _row(label: str, value) -> str:
    return (f'<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px">{escape(label)}</td>'
            f'<td style="padding:6px 0;color:#111;font-size:13px"><strong>'
            f'{escape(str(value)) if value not in (None, "", False) else "&mdash;"}'
            f'</strong></td></tr>')


def _wrapper(title: str, intro: str, rows: str, admin_url: str | None) -> str:
    link = ""
    if admin_url and admin_url.startswith("https://"):
        link = (f'<p style="margin:20px 0 0"><a href="{escape(admin_url)}" '
                f'style="background:#d92d20;color:#fff;padding:12px 20px;text-decoration:none;'
                f'font-size:13px;display:inline-block">Buka Dashboard Admin</a></p>')
    return (
        '<table role="presentation" width="100%" style="background:#f5f5f5;padding:24px">'
        '<tr><td align="center">'
        '<table role="presentation" width="600" style="background:#ffffff;font-family:Arial,Helvetica,sans-serif">'
        f'<tr><td style="background:#050505;padding:20px 24px;color:#fff;font-size:16px">'
        f'<strong>{escape(EMAIL_FROM_NAME)}</strong></td></tr>'
        f'<tr><td style="padding:24px">'
        f'<h1 style="margin:0 0 8px;font-size:20px;color:#111">{escape(title)}</h1>'
        f'<p style="margin:0 0 18px;color:#555;font-size:14px">{escape(intro)}</p>'
        f'<table role="presentation">{rows}</table>{link}'
        f'<p style="margin:24px 0 0;font-size:12px;color:#999">Email otomatis dari '
        f'{escape(EMAIL_FROM_NAME)}. Kami tidak pernah meminta password atau data kartu melalui email.</p>'
        '</td></tr></table></td></tr></table>'
    )


async def notify_new_lead(recipient: str, lead: dict, admin_url: str | None = None):
    if not recipient:
        return None
    rows = "".join([
        _row("Nama", lead.get("full_name")),
        _row("WhatsApp", lead.get("whatsapp")),
        _row("Email", lead.get("email")),
        _row("Kota", lead.get("city")),
        _row("Model diminati", lead.get("vehicle_name")),
        _row("Budget", lead.get("budget")),
        _row("Rencana beli", lead.get("timeline")),
        _row("Pembayaran", lead.get("financing")),
        _row("Tukar tambah", "Ya" if lead.get("trade_in") else "Tidak"),
        _row("Sumber", lead.get("lead_source")),
        _row("Kampanye (UTM)", lead.get("utm_campaign")),
        _row("Halaman masuk", lead.get("landing_page")),
        _row("Pesan", lead.get("message")),
    ])
    return await send_email(
        to=recipient,
        subject=f"Lead baru: {lead.get('full_name') or 'Tanpa nama'}"
                + (f" — {lead['vehicle_name']}" if lead.get("vehicle_name") else ""),
        html=_wrapper("Lead baru masuk", "Segera hubungi calon pembeli berikut.", rows, admin_url),
    )


async def notify_new_test_drive(recipient: str, td: dict, admin_url: str | None = None):
    if not recipient:
        return None
    rows = "".join([
        _row("Nama", td.get("full_name")),
        _row("WhatsApp", td.get("whatsapp")),
        _row("Email", td.get("email")),
        _row("Model", td.get("vehicle_name")),
        _row("Tanggal diminta", td.get("preferred_date")),
        _row("Waktu diminta", td.get("preferred_time")),
        _row("Lokasi", td.get("location")),
        _row("Catatan", td.get("notes")),
    ])
    return await send_email(
        to=recipient,
        subject=f"Permintaan test drive: {td.get('vehicle_name') or 'BYD'} — {td.get('full_name')}",
        html=_wrapper("Permintaan test drive baru",
                      "Konfirmasi ketersediaan unit dan jadwalnya.", rows, admin_url),
    )

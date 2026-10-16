import hashlib
import ipaddress
from datetime import datetime, timezone


class NormalizationError(ValueError):
    pass


VALID_RECORD_TYPES = {
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "NS",
    "PTR",
    "SOA",
    "SRV",
    "TXT",
    "ANY",
    "NULL",
    "OPT",
    "DS",
    "RRSIG",
    "DNSKEY",
}
VALID_RESPONSE_CODES = {
    "NOERROR",
    "FORMERR",
    "SERVFAIL",
    "NXDOMAIN",
    "NOTIMP",
    "REFUSED",
    "YXDOMAIN",
    "YXRRSET",
    "NXRRSET",
    "NOTAUTH",
    "NOTZONE",
}


def normalize_domain(raw_domain: str) -> str:
    if not raw_domain or not isinstance(raw_domain, str):
        raise NormalizationError("Domain must be a non-empty string.")

    domain = raw_domain.strip().lower()

    # Strip trailing dot if present (standard DNS FQDN representation)
    if domain.endswith("."):
        domain = domain[:-1]

    if not domain:
        raise NormalizationError("Domain cannot be empty after stripping trailing dot.")

    # Max DNS domain length is 253 characters
    if len(domain) > 253:
        raise NormalizationError(f"Domain exceeds maximum RFC length of 253 characters: {len(domain)}")

    # Check each label length (max 63 characters)
    labels = domain.split(".")
    for label in labels:
        if not label:
            raise NormalizationError("Domain contains empty labels.")
        if len(label) > 63:
            raise NormalizationError(f"Domain label exceeds maximum RFC length of 63 characters: {len(label)}")

    return domain


def validate_ip(ip_str: str) -> str:
    if not ip_str or not isinstance(ip_str, str):
        raise NormalizationError("Client IP address is required.")
    ip_clean = ip_str.strip()
    try:
        # Validates both IPv4 and IPv6
        ip_obj = ipaddress.ip_address(ip_clean)
        return str(ip_obj)
    except ValueError:
        raise NormalizationError(f"Invalid IP address format: {ip_str}")


def validate_record_type(rtype: str) -> str:
    cleaned = (rtype or "A").strip().upper()
    if cleaned not in VALID_RECORD_TYPES:
        return "A"  # Fallback to standard A record if unrecognized
    return cleaned


def validate_response_code(rcode: str) -> str:
    cleaned = (rcode or "NOERROR").strip().upper()
    if cleaned not in VALID_RESPONSE_CODES:
        return "NOERROR"
    return cleaned


def compute_event_fingerprint(
    observed_at: datetime,
    client_ip: str,
    normalized_domain: str,
    record_type: str,
    source_id: str,
) -> str:
    """
    Computes a deterministic stable SHA-256 fingerprint for deduplication.
    Identical queries at different timestamps produce distinct fingerprints.
    """
    ts_iso = observed_at.astimezone(timezone.utc).isoformat()
    raw = f"{ts_iso}|{client_ip}|{normalized_domain}|{record_type}|{source_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

"""Normalização de hostname para criação de domínios (alinhado à Resend)."""


def normalize_domain_name(raw: str) -> str:
    """Remove http(s)://, @, caminhos, query e porta comum quando o utilizador cola um URL."""
    s = (raw or "").strip()
    if not s:
        return ""
    if s.startswith("@"):
        s = s[1:].strip()
    low = s.lower()
    if low.startswith("https://"):
        s = s[8:]
    elif low.startswith("http://"):
        s = s[7:]
    s = s.strip()
    if "/" in s:
        s = s.split("/")[0]
    s = s.split("?")[0].split("#")[0]
    if ":" in s and not s.startswith("["):
        host, _, maybe_port = s.rpartition(":")
        if maybe_port.isdigit():
            s = host
    return s.strip()

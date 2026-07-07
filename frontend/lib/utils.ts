export function normalizeUrl(input: string): string {
  // Remove spaces, trim, and convert to lowercase
  let url = input.trim().toLowerCase().replace(/\s+/g, '');
  
  if (!url) return "";

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Check if there is a TLD (a dot in the domain part)
  const domainPart = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (domainPart && !domainPart.includes('.')) {
    url += '.com';
  }

  // If it doesn't start with http/https, prepend https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Ensure it has www. after the protocol
  const regex = /^(https?:\/\/)(?!www\.)(.*)$/;
  if (regex.test(url)) {
    url = url.replace(regex, "$1www.$2");
  }

  return url;
}

export function isValidUrl(input: string): boolean {
  try {
    const normalized = normalizeUrl(input);
    if (!normalized) return false;
    
    const url = new URL(normalized);
    // Simple check to ensure it has a valid root domain with a dot.
    const rootDomain = url.hostname.replace(/^www\./, '');
    return rootDomain.includes('.') && url.protocol.startsWith('http');
  } catch {
    return false;
  }
}

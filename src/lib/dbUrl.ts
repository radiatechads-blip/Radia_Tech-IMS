function encodeAuthComponent(value: string): string {
  if (!value) return "";

  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
}

export function normalizeDatabaseUrl(connectionString: string): string {
  if (!connectionString) {
    return connectionString;
  }

  const match = connectionString.match(/^([a-z][a-z0-9+.-]*:\/\/)(.*)$/i);
  if (!match) {
    return connectionString;
  }

  const [, protocol, rest] = match;
  const lastAtIndex = rest.lastIndexOf("@");

  if (lastAtIndex === -1) {
    return connectionString;
  }

  const authPart = rest.slice(0, lastAtIndex);
  const hostPart = rest.slice(lastAtIndex + 1);
  const firstColonIndex = authPart.indexOf(":");

  if (firstColonIndex === -1) {
    return `${protocol}${encodeAuthComponent(authPart)}@${hostPart}`;
  }

  const username = authPart.slice(0, firstColonIndex);
  const password = authPart.slice(firstColonIndex + 1);
  const encodedUsername = encodeAuthComponent(username);
  const encodedPassword = encodeAuthComponent(password);

  return `${protocol}${encodedUsername}:${encodedPassword}@${hostPart}`;
}

export function getBaseUrl() {
  // mantém /recorda-es/ no GH Pages e / no local
  return window.location.origin + window.location.pathname;
}

export function albumPublicLink(slug) {
  return `${getBaseUrl()}#/a/${slug}`;
  // se seu router usa "#/a/...", é isso.
}

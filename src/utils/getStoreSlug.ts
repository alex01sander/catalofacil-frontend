export function getStoreSlug() {
  const { hostname, pathname } = window.location;

  // Exemplo: minhaloja.seudominio.com
  if (hostname.split('.').length > 2) {
    return hostname.split('.')[0];
  }

  // Exemplo: seudominio.com/loja/minhaloja
  const match = pathname.match(/^\/loja\/([^\/]+)/);
  if (match) {
    return match[1];
  }

  return null;
} 
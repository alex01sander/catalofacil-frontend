export function getStoreSlug() {
  const { hostname, pathname } = window.location;
  
  console.log('[getStoreSlug] hostname:', hostname);
  console.log('[getStoreSlug] pathname:', pathname);

  // Exemplo: minhaloja.seudominio.com
  if (hostname.split('.').length > 2) {
    const slug = hostname.split('.')[0];
    console.log('[getStoreSlug] Slug extraído do hostname:', slug);
    return slug;
  }

  // Exemplo: seudominio.com/loja/minhaloja
  const match = pathname.match(/^\/loja\/([^\/]+)/);
  if (match) {
    console.log('[getStoreSlug] Slug extraído do pathname:', match[1]);
    return match[1];
  }

  console.warn('[getStoreSlug] Nenhum slug encontrado!');
  return null;
} 
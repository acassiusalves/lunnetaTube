/**
 * Resumo seguro de erros para logs do servidor.
 *
 * Erros do googleapis (gaxios) trazem a configuração da requisição, e a chave da
 * YouTube Data API vai no parâmetro `key` da URL, que o gaxios não mascara. Em
 * falhas de rede, a própria mensagem do erro inclui a URL completa. Por isso os
 * fluxos nunca devem logar o objeto de erro inteiro.
 */

// Parâmetros de query que carregam segredos (YouTube Data API e Graph API do Facebook)
const SECRET_QUERY_PARAMS = /([?&](?:key|access_token)=)[^&\s"']+/gi;

export function redactSecrets(text: string): string {
  return text.replace(SECRET_QUERY_PARAMS, '$1[REDACTED]');
}

type ErrorLike = {
  message?: unknown;
  response?: { data?: { error?: unknown } };
};

// Prefere o corpo de erro da API (não repete a chave); senão, a mensagem sem segredos
export function safeErrorSummary(error: unknown): unknown {
  const e = (typeof error === 'object' && error !== null ? error : {}) as ErrorLike;
  const apiError = e.response?.data?.error;
  if (apiError) return apiError;
  const message = typeof e.message === 'string' ? e.message : String(error);
  return redactSecrets(message);
}

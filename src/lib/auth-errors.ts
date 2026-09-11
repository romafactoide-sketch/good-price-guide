import type { AuthError } from "@supabase/supabase-js";

/**
 * Registra o erro técnico completo no console (diagnóstico) e devolve
 * uma mensagem amigável em português para a interface.
 */
export function describeAuthError(context: string, error: unknown): string {
  console.error(`[auth:${context}]`, error);

  const authError = error as Partial<AuthError> & { message?: string; status?: number };
  const code = authError?.code ?? "";
  const message = (authError?.message ?? "").toLowerCase();

  if (code === "user_already_exists" || message.includes("already registered") || message.includes("already been registered")) {
    return "Este e-mail já tem uma conta. Faça login ou recupere sua senha.";
  }
  if (code === "email_address_invalid" || message.includes("invalid email") || message.includes("email address")) {
    return "E-mail inválido. Confira o endereço digitado.";
  }
  if (code === "weak_password" || message.includes("password should") || message.includes("weak")) {
    return "Senha muito fraca. Use pelo menos 8 caracteres, com letras e números.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (code === "over_email_send_rate_limit" || authError?.status === 429 || message.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("timeout")) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }
  return "Não foi possível concluir. Tente novamente em alguns instantes.";
}

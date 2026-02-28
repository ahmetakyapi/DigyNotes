export class ClientApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.payload = payload;
  }
}

function normalizeApiMessage(message: string, status: number, fallbackMessage: string) {
  const trimmed = message.trim();
  if (!trimmed) return fallbackMessage;

  if (trimmed === "Unauthorized" || trimmed === "Giriş yapmanız gerekiyor") {
    return "Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.";
  }

  if (trimmed === "Forbidden") {
    return "Bu işlem için yetkiniz yok.";
  }

  if (trimmed === "Missing required fields") {
    return "Lütfen zorunlu alanları doldurun.";
  }

  if (
    trimmed === "Post not found" ||
    trimmed === "Profile not found" ||
    trimmed === "User not found" ||
    trimmed === "Internal server error"
  ) {
    return status === 404 ? "İlgili kayıt bulunamadı." : fallbackMessage;
  }

  return trimmed;
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getPayloadMessage(payload: unknown) {
  if (!payload) return null;

  if (typeof payload === "string") return payload;

  if (typeof payload === "object") {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return null;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "Bir hata oluştu."
): Promise<T> {
  const response = await fetch(input, init);
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const message = normalizeApiMessage(
      getPayloadMessage(payload) ?? response.statusText ?? fallbackMessage,
      response.status,
      fallbackMessage
    );

    throw new ClientApiError(message, response.status, payload);
  }

  return payload as T;
}

export function getClientErrorMessage(error: unknown, fallbackMessage = "Bir hata oluştu.") {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

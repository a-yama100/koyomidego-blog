// メール本文（HTML）に、フォームの入力をそのまま埋め込まないための変換。
// 入力に <a> や <img> を入れられると、自社のドメインから任意の HTML のメールを送れてしまう（なりすまし・迷惑メールの踏み台）。
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// 件名などヘッダーに入れる値。改行を消してヘッダーの差し込みを防ぐ。
export function headerSafe(value: unknown, max = 120): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").slice(0, max)
}

// <script type="application/ld+json"> に入れる JSON。文字列中の </script> で抜けられないようにする。
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}

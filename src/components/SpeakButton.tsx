/** Odczytuje tekst na głos (wbudowana synteza mowy przeglądarki). */
export function speak(text: string, lang = 'en-GB') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function SpeakButton({ text, lang }: { text: string; lang?: string }) {
  if (typeof window !== 'undefined' && !('speechSynthesis' in window)) return null;
  return (
    <button type="button" className="speak" title="Posłuchaj" aria-label={`Posłuchaj: ${text}`} onClick={() => speak(text, lang)}>
      🔊
    </button>
  );
}

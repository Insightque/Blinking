
// 가비지 컬렉션 방지를 위해 현재 발화 객체를 전역 범위에서 참조 유지
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const playSound = (type: 'pop' | 'tick' | 'success') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'tick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn("AudioContext play failed:", e);
  }
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const speakEnglish = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // 이전 음성 중단
  stopSpeech();

  // 짧은 딜레이 후 재생 (일부 브라우저에서 cancel 직후 speak 호출 시 무음 현상 방지)
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    // 참조 유지
    currentUtterance = utterance;

    utterance.onend = () => {
      currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      currentUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }, 50);
};

export const speakKorean = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  stopSpeech();

  setTimeout(() => {
    // 슬래시(/) 제거 및 특수문자 정리하여 자연스러운 읽기 지원
    const cleanText = text.replace(/\//g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    currentUtterance = utterance;

    utterance.onend = () => {
      currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      currentUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }, 50);
};

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bot, Loader2, Mic, Send, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, useHarvest } from "@/lib/harvest-store";
import { useI18n, type LanguageCode, type TranslationKey } from "@/i18n";
import { getSpeechRecognition, type SpeechRecognitionLike } from "@/lib/speech";

type ChatMessage = { role: "user" | "assistant"; text: string };

type NavCommand = { to: string; phrases: string[] };

// Voice navigation commands in every supported language. Longer phrases are
// listed first so substring matching picks the most specific command.
const NAV_COMMANDS: Record<LanguageCode, NavCommand[]> = {
  en: [
    { to: "/", phrases: ["open dashboard", "go home", "dashboard", "home"] },
    { to: "/crops", phrases: ["open my crops", "show my crops", "my crops", "crops"] },
    { to: "/crops/new", phrases: ["register a crop", "register crop", "new crop"] },
    { to: "/activities", phrases: ["open activities", "activities"] },
    { to: "/analytics", phrases: ["open analytics", "analytics"] },
    { to: "/passports", phrases: ["open passport", "passports", "passport"] },
    { to: "/settings", phrases: ["open settings", "settings", "open profile"] },
  ],
  hi: [
    { to: "/", phrases: ["डैशबोर्ड खोलो", "होम पेज खोलो", "डैशबोर्ड", "होम"] },
    { to: "/crops", phrases: ["मेरी फसलें खोलो", "फसलें दिखाओ", "मेरी फसलें", "फसलें"] },
    { to: "/crops/new", phrases: ["फसल दर्ज करें", "फसल दर्ज करो", "नई फसल"] },
    { to: "/activities", phrases: ["गतिविधियाँ खोलो", "गतिविधियाँ"] },
    { to: "/analytics", phrases: ["विश्लेषण खोलो", "विश्लेषण"] },
    { to: "/passports", phrases: ["पासपोर्ट खोलो", "पासपोर्ट"] },
    { to: "/settings", phrases: ["सेटिंग्स खोलो", "सेटिंग्स", "प्रोफ़ाइल खोलो"] },
  ],
  kn: [
    { to: "/", phrases: ["ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "ಮುಖಪುಟ"] },
    { to: "/crops", phrases: ["ನನ್ನ ಬೆಳೆಗಳನ್ನು ತೆರೆಯಿರಿ", "ಬೆಳೆಗಳನ್ನು ತೋರಿಸಿ", "ನನ್ನ ಬೆಳೆಗಳು", "ಬೆಳೆಗಳು"] },
    { to: "/crops/new", phrases: ["ಬೆಳೆ ನೋಂದಾಯಿಸಿ", "ಹೊಸ ಬೆಳೆ"] },
    { to: "/activities", phrases: ["ಚಟುವಟಿಕೆಗಳನ್ನು ತೆರೆಯಿರಿ", "ಚಟುವಟಿಕೆಗಳು"] },
    { to: "/analytics", phrases: ["ವಿಶ್ಲೇಷಣೆ ತೆರೆಯಿರಿ", "ವಿಶ್ಲೇಷಣೆ"] },
    { to: "/passports", phrases: ["ಪಾಸ್‌ಪೋರ್ಟ್ ತೆರೆಯಿರಿ", "ಪಾಸ್‌ಪೋರ್ಟ್"] },
    { to: "/settings", phrases: ["ಸೆಟ್ಟಿಂಗ್ ತೆರೆಯಿರಿ", "ಸೆಟ್ಟಿಂಗ್‌ಗಳು"] },
  ],
  te: [
    { to: "/", phrases: ["డాష్‌బోర్డ్ తెరవండి", "డాష్‌బోర్డ్", "హోమ్"] },
    { to: "/crops", phrases: ["నా పంటలు తెరవండి", "పంటలు చూపించండి", "నా పంటలు", "పంటలు"] },
    { to: "/crops/new", phrases: ["పంట నమోదు చేయండి", "కొత్త పంట"] },
    { to: "/activities", phrases: ["కార్యకలాపాలు తెరవండి", "కార్యకలాపాలు"] },
    { to: "/analytics", phrases: ["విశ్లేషణ తెరవండి", "విశ్లేషణ"] },
    { to: "/passports", phrases: ["పాస్‌పోర్ట్ తెరవండి", "పాస్‌పోర్ట్"] },
    { to: "/settings", phrases: ["సెట్టింగ్స్ తెరవండి", "సెట్టింగ్స్"] },
  ],
  ta: [
    { to: "/", phrases: ["டாஷ்போர்டை திறக்கவும்", "டாஷ்போர்டு", "முகப்பு"] },
    { to: "/crops", phrases: ["என் பயிர்களை திறக்கவும்", "பயிர்களை காட்டு", "என் பயிர்கள்", "பயிர்கள்"] },
    { to: "/crops/new", phrases: ["பயிர் பதிவு செய்யவும்", "புதிய பயிர்"] },
    { to: "/activities", phrases: ["செயல்பாடுகளை திறக்கவும்", "செயல்பாடுகள்"] },
    { to: "/analytics", phrases: ["பகுப்பாய்வை திறக்கவும்", "பகுப்பாய்வு"] },
    { to: "/passports", phrases: ["பாஸ்போர்ட்டை திறக்கவும்", "பாஸ்போர்ட்"] },
    { to: "/settings", phrases: ["அமைப்புகளை திறக்கவும்", "அமைப்புகள்"] },
  ],
  ml: [
    { to: "/", phrases: ["ഡാഷ്ബോർഡ് തുറക്കുക", "ഡാഷ്ബോർഡ്", "ഹോം"] },
    { to: "/crops", phrases: ["എന്റെ വിളകൾ തുറക്കുക", "വിളകൾ കാണിക്കുക", "എന്റെ വിളകൾ", "വിളകൾ"] },
    { to: "/crops/new", phrases: ["വിള രജിസ്റ്റർ ചെയ്യുക", "പുതിയ വിള"] },
    { to: "/activities", phrases: ["പ്രവർത്തനങ്ങൾ തുറക്കുക", "പ്രവർത്തനങ്ങൾ"] },
    { to: "/analytics", phrases: ["വിശകലനം തുറക്കുക", "വിശകലനം"] },
    { to: "/passports", phrases: ["പാസ്പോർട്ട് തുറക്കുക", "പാസ്പോർട്ട്"] },
    { to: "/settings", phrases: ["ക്രമീകരണങ്ങൾ തുറക്കുക", "ക്രമീകരണങ്ങൾ"] },
  ],
  mr: [
    { to: "/", phrases: ["डॅशबोर्ड उघडा", "डॅशबोर्ड", "होम"] },
    { to: "/crops", phrases: ["माझी पिके उघडा", "पिके दाखवा", "माझी पिके", "पिके"] },
    { to: "/crops/new", phrases: ["पीक नोंदणी करा", "नवीन पीक"] },
    { to: "/activities", phrases: ["क्रियाकलाप उघडा", "क्रियाकलाप"] },
    { to: "/analytics", phrases: ["विश्लेषण उघडा", "विश्लेषण"] },
    { to: "/passports", phrases: ["पासपोर्ट उघडा", "पासपोर्ट"] },
    { to: "/settings", phrases: ["सेटिंग्ज उघडा", "सेटिंग्ज"] },
  ],
  bn: [
    { to: "/", phrases: ["ড্যাশবোর্ড খুলুন", "ড্যাশবোর্ড", "হোম"] },
    { to: "/crops", phrases: ["আমার ফসল খুলুন", "ফসল দেখান", "আমার ফসল", "ফসল"] },
    { to: "/crops/new", phrases: ["ফসল নিবন্ধন করুন", "নতুন ফসল"] },
    { to: "/activities", phrases: ["কার্যক্রম খুলুন", "কার্যক্রম"] },
    { to: "/analytics", phrases: ["বিশ্লেষণ খুলুন", "বিশ্লেষণ"] },
    { to: "/passports", phrases: ["পাসপোর্ট খুলুন", "পাসপোর্ট"] },
    { to: "/settings", phrases: ["সেটিংস খুলুন", "সেটিংস"] },
  ],
  gu: [
    { to: "/", phrases: ["ડેશબોર્ડ ખોલો", "ડેશબોર્ડ", "હોમ"] },
    { to: "/crops", phrases: ["મારા પાકો ખોલો", "પાકો બતાવો", "મારા પાકો", "પાકો"] },
    { to: "/crops/new", phrases: ["પાક નોંધણી કરો", "નવો પાક"] },
    { to: "/activities", phrases: ["પ્રવૃત્તિઓ ખોલો", "પ્રવૃત્તિઓ"] },
    { to: "/analytics", phrases: ["વિશ્લેષણ ખોલો", "વિશ્લેષણ"] },
    { to: "/passports", phrases: ["પાસપોર્ટ ખોલો", "પાસપોર્ટ"] },
    { to: "/settings", phrases: ["સેટિંગ્સ ખોલો", "સેટિંગ્સ"] },
  ],
  pa: [
    { to: "/", phrases: ["ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹੋ", "ਡੈਸ਼ਬੋਰਡ", "ਹੋਮ"] },
    { to: "/crops", phrases: ["ਮੇਰੀਆਂ ਫ਼ਸਲਾਂ ਖੋਲ੍ਹੋ", "ਫ਼ਸਲਾਂ ਦਿਖਾਓ", "ਮੇਰੀਆਂ ਫ਼ਸਲਾਂ", "ਫ਼ਸਲਾਂ"] },
    { to: "/crops/new", phrases: ["ਫ਼ਸਲ ਰਜਿਸਟਰ ਕਰੋ", "ਨਵੀਂ ਫ਼ਸਲ"] },
    { to: "/activities", phrases: ["ਸਰਗਰਮੀਆਂ ਖੋਲ੍ਹੋ", "ਸਰਗਰਮੀਆਂ"] },
    { to: "/analytics", phrases: ["ਵਿਸ਼ਲੇਸ਼ਣ ਖੋਲ੍ਹੋ", "ਵਿਸ਼ਲੇਸ਼ਣ"] },
    { to: "/passports", phrases: ["ਪਾਸਪੋਰਟ ਖੋਲ੍ਹੋ", "ਪਾਸਪੋਰਟ"] },
    { to: "/settings", phrases: ["ਸੈਟਿੰਗਾਂ ਖੋਲ੍ਹੋ", "ਸੈਟਿੰਗਾਂ"] },
  ],
  or: [
    { to: "/", phrases: ["ଡ୍ୟାସବୋର୍ଡ ଖୋଲନ୍ତୁ", "ଡ୍ୟାସବୋର୍ଡ", "ହୋମ"] },
    { to: "/crops", phrases: ["ମୋ ଫସଲ ଖୋଲନ୍ତୁ", "ଫସଲ ଦେଖାନ୍ତୁ", "ମୋ ଫସଲ", "ଫସଲ"] },
    { to: "/crops/new", phrases: ["ଫସଲ ପଞ୍ଜୀକରଣ କରନ୍ତୁ", "ନୂଆ ଫସଲ"] },
    { to: "/activities", phrases: ["କାର୍ଯ୍ୟକଳାପ ଖୋଲନ୍ତୁ", "କାର୍ଯ୍ୟକଳାପ"] },
    { to: "/analytics", phrases: ["ବିଶ୍ଳେଷଣ ଖୋଲନ୍ତୁ", "ବିଶ୍ଳେଷଣ"] },
    { to: "/passports", phrases: ["ପାସପୋର୍ଟ ଖୋଲନ୍ତୁ", "ପାସପୋର୍ଟ"] },
    { to: "/settings", phrases: ["ସେଟିଂ ଖୋଲନ୍ତୁ", "ସେଟିଂ"] },
  ],
  as: [
    { to: "/", phrases: ["ডেশ্ববৰ্ড খোলক", "ডেশ্ববৰ্ড", "হোম"] },
    { to: "/crops", phrases: ["মোৰ শস্য খোলক", "শস্য দেখুৱাওক", "মোৰ শস্য", "শস্য"] },
    { to: "/crops/new", phrases: ["শস্য পঞ্জীভুক্ত কৰক", "নতুন শস্য"] },
    { to: "/activities", phrases: ["কাৰ্য্যকলাপ খোলক", "কাৰ্য্যকলাপ"] },
    { to: "/analytics", phrases: ["বিশ্লেষণ খোলক", "বিশ্লেষণ"] },
    { to: "/passports", phrases: ["পাছপ’ৰ্ট খোলক", "পাছপ’ৰ্ট"] },
    { to: "/settings", phrases: ["ছেটিংছ খোলক", "ছেটিংছ"] },
  ],
  ur: [
    { to: "/", phrases: ["ڈیش بورڈ کھولیں", "ڈیش بورڈ", "ہوم"] },
    { to: "/crops", phrases: ["میری فصلیں کھولیں", "فصلیں دکھائیں", "میری فصلیں", "فصلیں"] },
    { to: "/crops/new", phrases: ["فصل رجسٹر کریں", "نئی فصل"] },
    { to: "/activities", phrases: ["سرگرمیاں کھولیں", "سرگرمیاں"] },
    { to: "/analytics", phrases: ["تجزیہ کھولیں", "تجزیہ"] },
    { to: "/passports", phrases: ["پاسپورٹ کھولیں", "پاسپورٹ"] },
    { to: "/settings", phrases: ["ترتیبات کھولیں", "ترتیبات"] },
  ],
};

const ROUTE_VOICE_KEY: Record<string, TranslationKey> = {
  "/": "voice.page.dashboard",
  "/crops": "voice.page.crops",
  "/activities": "voice.page.activities",
  "/analytics": "voice.page.analytics",
  "/passports": "voice.page.passports",
  "/settings": "voice.page.settings",
};

function normalizeSpeech(text: string): string {
  return text.toLowerCase().replace(/[.,!?।॥]/g, " ").replace(/\s+/g, " ").trim();
}

function matchNavCommand(text: string, lang: LanguageCode): NavCommand | null {
  const normalized = normalizeSpeech(text);
  if (!normalized) return null;
  const commands = NAV_COMMANDS[lang] ?? NAV_COMMANDS.en;
  for (const command of commands) {
    for (const phrase of command.phrases) {
      const key = normalizeSpeech(phrase);
      if (!key) continue;
      if (normalized.includes(key) || (key.length >= 2 && key.includes(normalized))) {
        return command;
      }
    }
  }
  return null;
}

export function FarmerAssistant() {
  const { t, lang, speechTag } = useI18n();
  const { crops, profile } = useHarvest();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // The public passport page is buyer-facing, so the farmer assistant is
  // hidden there.
  const hidden = pathname.startsWith("/passport/");

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  // Stop any in-flight recognition when the panel closes.
  useEffect(() => {
    if (!open) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setListening(false);
    }
  }, [open]);

  const currentCrop = useMemo(() => {
    const match = pathname.match(/^\/(?:crops|passport)\/(\d+)/);
    if (!match) return undefined;
    return crops.find((c) => c.id === match[1]);
  }, [pathname, crops]);

  const context = useMemo(
    () => ({
      ...(currentCrop
        ? { cropName: currentCrop.name, variety: currentCrop.variety, stage: currentCrop.stage }
        : {}),
      location: profile.location || undefined,
      crops: crops.map((c) => ({ name: c.name, stage: c.stage })),
    }),
    [currentCrop, crops, profile.location],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busy) return;
      setBusy(true);
      setMessages((prev) => [...prev, { role: "user", text: message }]);
      setInput("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, lang, context }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; reply?: string; configured?: boolean; error?: string }
          | null;
        if (!response.ok) {
          if (payload?.configured === false) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", text: t("assistant.notConfigured") },
            ]);
          } else {
            throw new Error(payload?.error || t("assistant.error"));
          }
          return;
        }
        const reply = payload?.reply?.trim();
        if (!reply) throw new Error(t("assistant.error"));
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `${t("assistant.error")} ${t("assistant.errorDesc")}` },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, context, lang, t],
  );

  const handleTranscript = useCallback(
    (raw: string) => {
      const command = matchNavCommand(raw, lang);
      if (command) {
        const page = t(ROUTE_VOICE_KEY[command.to] ?? "voice.page.dashboard");
        toast.success(t("assistant.commandOpen", { page }));
        void navigate({ to: command.to as never });
        return;
      }
      const text = raw.trim();
      if (!text) {
        toast.error(t("assistant.commandTryAgain"));
        return;
      }
      // Recognized speech that isn't a navigation command fills the input so
      // the farmer can review it before sending.
      setInput(text);
    },
    [lang, navigate, t],
  );

  const startListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = getSpeechRecognition();
    if (!recognition) {
      toast.error(t("assistant.micUnsupported"));
      return;
    }
    recognition.lang = speechTag;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const result = event.results?.[0]?.[0];
      if (result?.transcript) handleTranscript(result.transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.error(t("assistant.micPermission"));
      } else if (event.error !== "aborted") {
        toast.error(t("assistant.commandTryAgain"));
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      toast.error(t("assistant.micPermission"));
      setListening(false);
    }
  }, [handleTranscript, listening, speechTag, t]);

  if (hidden) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="card-soft flex h-[min(70vh,560px)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl shadow-lift">
          <div className="flex items-start justify-between gap-3 border-b border-border bg-primary px-4 py-3.5 text-primary-foreground">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15">
                <Bot className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{t("assistant.title")}</h2>
                <p className="truncate text-xs opacity-85">{t("assistant.tagline")}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={t("assistant.clear")}
                className="grid size-8 place-items-center rounded-xl text-primary-foreground/85 transition-colors hover:bg-primary-foreground/15"
                onClick={() => setMessages([])}
              >
                <Trash2 className="size-4" />
              </button>
              <button
                type="button"
                aria-label={t("assistant.close")}
                className="grid size-8 place-items-center rounded-xl text-primary-foreground/85 transition-colors hover:bg-primary-foreground/15"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-gold/40 bg-gold/10 p-3.5 text-sm leading-relaxed">
                <Sparkles className="mb-1.5 size-4 text-gold" />
                {t("assistant.greeting")}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                      : "max-w-[90%] whitespace-pre-wrap rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm leading-relaxed"
                  }
                >
                  {message.text}
                </div>
              ))
            )}
            {busy ? (
              <div className="flex max-w-[90%] items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("assistant.thinking")}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <button
              type="button"
              aria-label={listening ? t("assistant.listening") : t("assistant.micUnsupported")}
              onClick={startListening}
              className={`grid size-11 shrink-0 place-items-center rounded-2xl border transition-colors ${
                listening
                  ? "animate-pulse border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/40 text-primary hover:bg-accent"
              }`}
            >
              <Mic className="size-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send(input);
              }}
              placeholder={t("assistant.placeholder")}
              aria-label={t("assistant.placeholder")}
              className="h-11 min-w-0 flex-1 rounded-2xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
            />
            <Button
              size="icon"
              aria-label={t("assistant.send")}
              className="size-11 shrink-0 rounded-2xl"
              disabled={busy || !input.trim()}
              onClick={() => void send(input)}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        size="icon"
        aria-label={t("assistant.open")}
        className="size-14 rounded-full shadow-lift"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </Button>
    </div>
  );
}

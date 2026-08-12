// ---------------------------------------------------------------------------
// HarvestID — localized crop display names.
//
// Farmer-entered crop names are stored in the database exactly as typed and
// are the canonical source the image resolver works from (e.g. "Tomato" ->
// catalog key "tomato" -> crop photo). This module only translates the name
// at render time for crops we positively recognise, so:
//   * the image resolver always receives the original stored name (never the
//     localized one), keeping the correct photo,
//   * unknown / custom farmer crops keep their exact original spelling,
//   * nothing is ever written back to the database.
// ---------------------------------------------------------------------------

import { resolveCropKey } from "@/lib/crop-images";
import type { LanguageCode } from "@/i18n";

type LocalizedNames = Partial<Record<LanguageCode, string>>;

/** Canonical crop key -> localized display name per supported language. */
const CROP_NAMES: Record<string, LocalizedNames> = {
  tomato: { en: "Tomato", hi: "टमाटर", kn: "ಟೊಮೇಟೊ", te: "టమాటా", ta: "தக்காளி", ml: "തക്കാളി", mr: "टोमॅटो", bn: "টমেটো", gu: "ટમેટું", pa: "ਟਮਾਟਰ", or: "ଟମାଟୋ", as: "টমেটো", ur: "ٹماٹر" },
  wheat: { en: "Wheat", hi: "गेहूं", kn: "ಗೋಧಿ", te: "గోధుమ", ta: "கோதுமை", ml: "ഗോതമ്പ്", mr: "गहू", bn: "গম", gu: "ઘઉં", pa: "ਕਣਕ", or: "ଗହମ", as: "গম", ur: "گندم" },
  rice: { en: "Rice", hi: "चावल", kn: "ಅಕ್ಕಿ", te: "బియ్యం", ta: "அரிசி", ml: "അരി", mr: "तांदूळ", bn: "চাল", gu: "ચોખા", pa: "ਚੌਲ", or: "ଚାଉଳ", as: "চাউল", ur: "چاول" },
  maize: { en: "Maize", hi: "मक्का", kn: "ಮೆಕ್ಕೆಜೋಳ", te: "మొక్కజొన్న", ta: "மக்காச்சோளம்", ml: "ചോളം", mr: "मका", bn: "ভুট্টা", gu: "મકાઈ", pa: "ਮੱਕੀ", or: "ମକ୍କା", as: "ভূট্টা", ur: "مکئی" },
  potato: { en: "Potato", hi: "आलू", kn: "ಆಲೂಗಡ್ಡೆ", te: "బంగాళాదుంప", ta: "உருளைக்கிழங்கு", ml: "ഉരുളക്കിഴങ്ങ്", mr: "बटाटा", bn: "আলু", gu: "બટાકા", pa: "ਆਲੂ", or: "ଆଳୁ", as: "আলু", ur: "آلو" },
  onion: { en: "Onion", hi: "प्याज", kn: "ಈರುಳ್ಳಿ", te: "ఉల్లిపాయ", ta: "வெங்காயம்", ml: "സവാള", mr: "कांदा", bn: "পেঁয়াজ", gu: "ડુંગળી", pa: "ਪਿਆਜ਼", or: "ପିଆଜ", as: "পিয়াঁজ", ur: "پیاز" },
  carrot: { en: "Carrot", hi: "गाजर", kn: "ಕ್ಯಾರೆಟ್", te: "క్యారెట్", ta: "கேரட்", ml: "കാരറ്റ്", mr: "गाजर", bn: "গাজর", gu: "ગાજર", pa: "ਗਾਜਰ", or: "ଗାଜର", as: "গাজৰ", ur: "گاجر" },
  eggplant: { en: "Brinjal", hi: "बैंगन", kn: "ಬದನೆಕಾಯಿ", te: "వంకాయ", ta: "கத்தரிக்காய்", ml: "വഴുതനങ്ങ", mr: "वांगी", bn: "বেগুন", gu: "રીંગણ", pa: "ਬਤਾਊਂ", or: "ବାଇଗଣ", as: "বেঙেনা", ur: "بینگن" },
  okra: { en: "Okra", hi: "भिंडी", kn: "ಬೆಂಡೆಕಾಯಿ", te: "బెండ", ta: "வெண்டைக்காய்", ml: "വെണ്ടക്ക", mr: "भेंडी", bn: "ঢেঁড়স", gu: "ભીંડા", pa: "ਭਿੰਡੀ", or: "ଭେଣ୍ଡି", as: "ঢেঁকীয়া", ur: "بھنڈی" },
  chilli: { en: "Chilli", hi: "मिर्च", kn: "ಮೆಣಸಿನಕಾಯಿ", te: "మిరపకాయ", ta: "மிளகாய்", ml: "മുളക്", mr: "मिरची", bn: "মরিচ", gu: "મરચું", pa: "ਮਿਰਚ", or: "ଲଙ୍କା", as: "জলকীয়া", ur: "مرچ" },
  cotton: { en: "Cotton", hi: "कपास", kn: "ಹತ್ತಿ", te: "పత్తి", ta: "பருத்தி", ml: "പരുത്തി", mr: "कापूस", bn: "তুলা", gu: "કપાસ", pa: "ਕਪਾਹ", or: "ତୁଳା", as: "কপাহ", ur: "کپاس" },
  sugarcane: { en: "Sugarcane", hi: "गन्ना", kn: "ಕಬ್ಬು", te: "చెరకు", ta: "கரும்பு", ml: "കരിമ്പ്", mr: "ऊस", bn: "আখ", gu: "શેરડી", pa: "ਗੰਨਾ", or: "ଆଖୁ", as: "আখ", ur: "گنا" },
  groundnut: { en: "Groundnut", hi: "मूंगफली", kn: "ನೆಲಗಡಲೆ", te: "వేరుశెనగ", ta: "வேர்க்கடலை", ml: "നിലക്കടല", mr: "शेंगदाणा", bn: "চিনাবাদাম", gu: "મગફળી", pa: "ਮੂੰਗਫਲੀ", or: "ଚିନାବାଦାମ", as: "বাদাম", ur: "مونگ پھلی" },
  soybean: { en: "Soybean", hi: "सोयाबीन", kn: "ಸೋಯಾಬೀನ್", te: "సోయాబీన్", ta: "சோயாபீன்", ml: "സോയാബീൻ", mr: "सोयाबीन", bn: "সয়াবিন", gu: "સોયાબીન", pa: "ਸੋਇਆਬੀਨ", or: "ସୋୟାବିନ", as: "সয়াবিন", ur: "سویابین" },
  mango: { en: "Mango", hi: "आम", kn: "ಮಾವು", te: "మామిడి", ta: "மாம்பழம்", ml: "മാങ്ങ", mr: "आंबा", bn: "আম", gu: "કેરી", pa: "ਅੰਬ", or: "ଆମ୍ବ", as: "আম", ur: "آم" },
  banana: { en: "Banana", hi: "केला", kn: "ಬಾಳೆ", te: "అరటి", ta: "வாழைப்பழம்", ml: "വാഴപ്പഴം", mr: "केळे", bn: "কলা", gu: "કેળું", pa: "ਕੇਲਾ", or: "କଦଳୀ", as: "কল", ur: "کیلا" },
  apple: { en: "Apple", hi: "सेब", kn: "ಸೇಬು", te: "ఆపిల్", ta: "ஆப்பிள்", ml: "ആപ്പിൾ", mr: "सफरचंद", bn: "আপেল", gu: "સફરજન", pa: "ਸੇਬ", or: "ସେଉ", as: "আপেল", ur: "سیب" },
  orange: { en: "Orange", hi: "संतरा", kn: "ಕಿತ್ತಳೆ", te: "నారింజ", ta: "ஆரஞ்சு", ml: "ഓറഞ്ച്", mr: "संत्रे", bn: "কমলা", gu: "સંતરું", pa: "ਸੰਤਰਾ", or: "କମଳା", as: "কমলা", ur: "سنترا" },
  grapes: { en: "Grapes", hi: "अंगूर", kn: "ದ್ರಾಕ್ಷಿ", te: "ద్రాక్ష", ta: "திராட்சை", ml: "മുന്തിരി", mr: "द्राक्ष", bn: "আঙ্গুর", gu: "દ્રાક્ષ", pa: "ਅੰਗੂਰ", or: "ଅଙ୍ଗୁର", as: "আঙুৰ", ur: "انگور" },
  coconut: { en: "Coconut", hi: "नारियल", kn: "ತೆಂಗಿನಕಾಯಿ", te: "కొబ్బరి", ta: "தேங்காய்", ml: "തേങ്ങ", mr: "नारळ", bn: "নারিকেল", gu: "નારિયેળ", pa: "ਨਾਰੀਅਲ", or: "ନଡ଼ିଆ", as: "নাৰিকল", ur: "ناریل" },
};

/**
 * Localized display name for a farmer-entered crop, or the original name when
 * the crop is not in the known catalog. Never used for image resolution —
 * the image resolver always receives the original stored name.
 */
export function localizeCropName(
  name: string,
  variety: string,
  lang: LanguageCode,
): string {
  if (!name) return name;
  const key = resolveCropKey(name, variety);
  if (!key) return name;
  return CROP_NAMES[key]?.[lang] || name;
}

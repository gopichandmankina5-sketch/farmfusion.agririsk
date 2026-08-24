const agricultureTranslations = {
  crop: {
    Rice: {
      en: "Rice",
      te: "వరి",
      ta: "நெல்",
      hi: "चावल"
    },
    Wheat: {
      en: "Wheat",
      te: "గోధుమ",
      ta: "கோதுமை",
      hi: "गेहूँ"
    },
    Sugarcane: {
      en: "Sugarcane",
      te: "చెరకు",
      ta: "கரும்பு",
      hi: "गन्ना"
    },
    Cotton: {
      en: "Cotton",
      te: "పత్తి",
      ta: "பருத்தி",
      hi: "कपास"
    },
    Maize: {
      en: "Maize",
      te: "మొక్కజొన్న",
      ta: "மக்காச்சோளம்",
      hi: "मक्का"
    },
    Soybean: {
      en: "Soybean",
      te: "సోయాబీన్",
      ta: "சோயாபீன்",
      hi: "सोयाबीन"
    },
    Bajra: {
      en: "Bajra",
      te: "సజ్జలు",
      ta: "கம்பு", 
      hi: "बाजरा"
    },
    Jowar: {
      en: "Jowar",
      te: "జొన్న",
      ta: "சோளம்",
      hi: "ज्वार"
    },
    Sunflower: {
      en: "Sunflower",
      te: "పొద్దుతిరుగుడు",
      ta: "சூரியகாந்தி",
      hi: "सूरजमुखी"
    },
    Turmeric: {
      en: "Turmeric",
      te: "పసుపు",
      ta: "மஞ்சள்",
      hi: "हल्दी"
    },
    Onion: {
      en: "Onion",
      te: "ఉల్లిపాయ",
      ta: "வெங்காயம்",
      hi: "प्याज"
    },
    Tomato: {
      en: "Tomato",
      te: "టమాటా",
      ta: "தக்காளி",
      hi: "टमाटर"
    },
    Potato: {
      en: "Potato",
      te: "బంగాళాదుంప",
      ta: "உருளைக்கிழங்கு",
      hi: "आलू"
    },
    Mustard: {
      en: "Mustard",
      te: "ఆవాలు",
      ta: "கடுகு",
      hi: "सरसों"
    }
  },
  season: {
    Kharif: {
      en: "Kharif",
      te: "ఖరీఫ్",
      ta: "காரிஃப்",
      hi: "खरीफ"
    },
    Rabi: {
      en: "Rabi",
      te: "రబీ",
      ta: "ரபி",
      hi: "रबी"
    },
    Zaid: {
      en: "Zaid",
      te: "జైద్",
      ta: "ஜைத்",
      hi: "ज़ायद"
    }
  }
};

// = (type, value, language) => {
  if (!value) return value;
  
  if (agricultureTranslations[type] && agricultureTranslations[type][value]) {
    const translations = agricultureTranslations[type][value];
    if (translations[language]) {
      return translations[language];
    }
    if (translations["en"]) {
      return translations["en"];
    }
  }
  
  return value; // fallback to original value
};

export default agricultureTranslations;

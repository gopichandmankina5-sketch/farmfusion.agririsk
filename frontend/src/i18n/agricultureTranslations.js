export const crops = [
  {
    id: "rice",
    names: {
      en: "Rice",
      hi: "चावल",
      te: "వరి",
      ta: "நெல்"
    }
  },
  {
    id: "wheat",
    names: {
      en: "Wheat",
      hi: "गेहूं",
      te: "గోధుమ",
      ta: "கோதுமை"
    }
  },
  {
    id: "sugarcane",
    names: {
      en: "Sugarcane",
      hi: "गन्ना",
      te: "చెరకు",
      ta: "கரும்பு"
    }
  },
  {
    id: "cotton",
    names: {
      en: "Cotton",
      hi: "कपास",
      te: "పత్తి",
      ta: "பருத்தி"
    }
  },
  {
    id: "maize",
    names: {
      en: "Maize",
      hi: "मक्का",
      te: "మొక్కజొన్న",
      ta: "மக்காச்சோளம்"
    }
  },
  {
    id: "soybean",
    names: {
      en: "Soybean",
      hi: "सोयाबीन",
      te: "సోయాబీన్",
      ta: "சோயாபீன்"
    }
  },
  {
    id: "groundnut",
    names: {
      en: "Groundnut",
      hi: "मूंगफली",
      te: "వేరుశెనగ",
      ta: "நிலக்கடலை"
    }
  },
  {
    id: "bajra",
    names: {
      en: "Bajra",
      hi: "बाजरा",
      te: "సజ్జ",
      ta: "கம்பு"
    }
  },
  {
    id: "jowar",
    names: {
      en: "Jowar",
      hi: "ज्वार",
      te: "జొన్న",
      ta: "சோளம்"
    }
  },
  {
    id: "sunflower",
    names: {
      en: "Sunflower",
      hi: "सूरजमुखी",
      te: "పొద్దుతిరుగుడు",
      ta: "சூரியகாந்தி"
    }
  },
  {
    id: "turmeric",
    names: {
      en: "Turmeric",
      hi: "हल्दी",
      te: "పసుపు",
      ta: "மஞ்சள்"
    }
  },
  {
    id: "onion",
    names: {
      en: "Onion",
      hi: "प्याज",
      te: "ఉల్లిపాయ",
      ta: "வெங்காயம்"
    }
  },
  {
    id: "tomato",
    names: {
      en: "Tomato",
      hi: "टमाटर",
      te: "టమాటా",
      ta: "தக்காளி"
    }
  },
  {
    id: "potato",
    names: {
      en: "Potato",
      hi: "आलू",
      te: "బంగాళాదుంప",
      ta: "உருளைக்கிழங்கு"
    }
  },
  {
    id: "mustard",
    names: {
      en: "Mustard",
      hi: "सरसों",
      te: "ఆవాలు",
      ta: "கடுகு"
    }
  }
];

export const seasons = [
  {
    id: "kharif",
    names: {
      en: "Kharif",
      hi: "खरीफ",
      te: "ఖరీఫ్",
      ta: "கரீஃப்"
    }
  },
  {
    id: "rabi",
    names: {
      en: "Rabi",
      hi: "रबी",
      te: "రబీ",
      ta: "ரபி"
    }
  },
  {
    id: "zaid",
    names: {
      en: "Zaid",
      hi: "जायद",
      te: "జైద్",
      ta: "சைத்"
    }
  }
];

export const getAgricultureList = (type) => {
  if (type === 'crop') return crops;
  if (type === 'season') return seasons;
  return [];
};

export const translateAgriculture = (type, value, language) => {
  if (!value) return value;
  const arr = getAgricultureList(type);
  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const match = arr.find(item => item.id === normalizedValue);
  if (match) {
    return match.names?.[language] || match.names?.en || value;
  }
  return value;
};


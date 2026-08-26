import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { districtsByState } from './src/data/indiaData.js';
import { stateTranslations } from './src/i18n/stateTranslations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to calculate risk level
function getRiskLevel(score) {
    if (score <= 30) return "LOW";
    if (score <= 55) return "MEDIUM";
    if (score <= 75) return "HIGH";
    return "CRITICAL";
}

// Generate random number between min and max
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// Ensure crop choices
const CROPS = ["Rice", "Wheat", "Sugarcane", "Cotton", "Maize", "Soybean", "Groundnut"];

// Generate the CSV data
let csvContent = "state,district,avg_risk_score,max_risk_score,std_risk_score,avg_weather_risk,avg_pest_risk,avg_soil_risk,avg_market_risk,avg_prod_risk,dominant_crop,dominant_season,n_records,risk_level\n";

for (const stateId in stateTranslations) {
    const stateObj = stateTranslations[stateId];
    const stateName = stateObj.names.en;
    const districts = districtsByState[stateId] || [];
    
    for (const district of districts) {
        const districtName = district.names.en;
        
        // Realistic random values
        const avg_weather = getRandom(5, 30);
        const avg_pest = getRandom(15, 45);
        const avg_soil = getRandom(20, 50);
        const avg_market = getRandom(10, 20);
        const avg_prod = getRandom(30, 60);
        
        // Use realistic weight approximations for overall risk
        let avg_risk = (avg_weather * 0.25) + (avg_pest * 0.20) + (avg_soil * 0.20) + (avg_market * 0.15) + (avg_prod * 0.20);
        
        // If state is Rajasthan, make it higher risk on average
        if (stateId === "rajasthan") avg_risk += 15;
        // If Punjab, maybe lower
        if (stateId === "punjab") avg_risk -= 10;
        
        // clamp
        avg_risk = Math.max(10, Math.min(avg_risk, 95));
        
        const max_risk = Math.min(100, avg_risk + getRandom(5, 15));
        const std_risk = getRandom(2, 8);
        
        const crop = CROPS[Math.floor(Math.random() * CROPS.length)];
        const season = Math.random() > 0.5 ? "Kharif" : "Rabi";
        const level = getRiskLevel(avg_risk);
        
        csvContent += `${stateName},${districtName},${avg_risk.toFixed(1)},${max_risk.toFixed(1)},${std_risk.toFixed(1)},${avg_weather.toFixed(1)},${avg_pest.toFixed(1)},${avg_soil.toFixed(1)},${avg_market.toFixed(1)},${avg_prod.toFixed(1)},${crop},${season},45,${level}\n`;
    }
}

const outputPath = path.join(__dirname, '../data/regional/district_risk.csv');
fs.writeFileSync(outputPath, csvContent);
console.log(`Generated ${outputPath} successfully.`);

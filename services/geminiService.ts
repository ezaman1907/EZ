
import { GoogleGenAI } from "@google/genai";
import { Asset, DeviceType } from "../types";

export const analyzeInventoryRisks = async (inventory: Asset[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "API Anahtarı eksik. Lütfen AI analizi için API anahtarını yapılandırın.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Calculate Specific Segment Stats
    const windowsAssets = inventory.filter(a => a.type === DeviceType.Desktop || a.type === DeviceType.Notebook);
    const iosAssets = inventory.filter(a => a.type === DeviceType.iPhone || a.type === DeviceType.iPad);
    const macAssets = inventory.filter(a => a.type === DeviceType.MacBook);

    const windowsTotal = windowsAssets.length;
    const windowsInIntune = windowsAssets.filter(a => a.compliance?.inIntune).length;
    const windowsRatio = windowsTotal > 0 ? Math.round((windowsInIntune / windowsTotal) * 100) : 0;

    const iosTotal = iosAssets.length;
    const iosInIntune = iosAssets.filter(a => a.compliance?.inIntune).length;
    const iosRatio = iosTotal > 0 ? Math.round((iosInIntune / iosTotal) * 100) : 0;

    const macTotal = macAssets.length;
    const macInJamf = macAssets.filter(a => a.compliance?.inJamf).length;
    const macRatio = macTotal > 0 ? Math.round((macInJamf / macTotal) * 100) : 0;

    const totalAssets = inventory.length;
    const missingDefender = inventory.filter(a => 
        (a.type === DeviceType.Desktop || a.type === DeviceType.Notebook || a.type === DeviceType.MacBook || a.type === DeviceType.iPhone || a.type === DeviceType.iPad) 
        && !a.compliance?.inDefender
    ).length;

    const prompt = `
      Sen KoçSistem için çalışan Kıdemli BT Güvenlik Denetçisisin. Aşağıdaki envanter verilerini analiz et ve Üst Yönetim (C-Level) için kapsamlı bir **"BT Varlık Güvenlik Risk Raporu"** hazırla.

      RAPOR VERİLERİ:
      - Toplam Varlık: ${totalAssets}
      - Windows Uyumluluk (Intune): %${windowsRatio} (${windowsInIntune}/${windowsTotal})
      - iOS/Mobil Uyumluluk (Intune): %${iosRatio} (${iosInIntune}/${iosTotal})
      - macOS Uyumluluk (Jamf): %${macRatio} (${macInJamf}/${macTotal})
      - Uç Nokta Koruması Eksik (Defender): ${missingDefender} cihaz

      Lütfen raporu aşağıdaki Markdown formatında ve profesyonel bir tonla yaz:

      ### 1. Yönetici Özeti
      Kurumun genel güvenlik duruşuna dair 2-3 cümlelik net bir özet.

      ### 2. Kritik Bulgular & Risk Analizi
      Her platform (Windows, iOS, macOS) için risk seviyesini (Düşük/Orta/Yüksek) belirt ve nedenlerini açıkla. Özellikle Defender eksikliğinin yarattığı riske vurgu yap.

      ### 3. Stratejik Öneriler
      Yönetimin alması gereken 3 somut, acil aksiyon.

      Not: Başlıklar için ### kullan. Önemli kısımları **kalın** yaz. Çıktı Türkçe olsun.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analiz tamamlandı ancak metin döndürülemedi.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Şu anda AI analizi oluşturulamıyor.";
  }
};

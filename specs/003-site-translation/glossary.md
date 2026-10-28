# Glossary: agreed terms

One term per concept, used the same way on every page. The translations are machine-assisted and **have not been reviewed by a native speaker**; a reviewer should start with this table because every other string follows from it.

| English | हिन्दी | मराठी | ગુજરાતી | ಕನ್ನಡ | தமிழ் |
|---|---|---|---|---|---|
| Case | मामला | प्रकरण | કેસ | ಪ್ರಕರಣ | வழக்கு |
| Court | न्यायालय | न्यायालय | અદાલત / કોર્ટ | ನ್ಯಾಯಾಲಯ | நீதிமன்றம் |
| High Court | उच्च न्यायालय | उच्च न्यायालय | હાઈકોર્ટ | ಹೈಕೋರ್ಟ್ | உயர் நீதிமன்றம் |
| Order | आदेश | आदेश | આદેશ | ಆದೇಶ | உத்தரவு |
| Judgment | निर्णय | निकाल | ચુકાદો | ತೀರ್ಪು | தீர்ப்பு |
| Search | खोजें | शोधा | શોધો | ಹುಡುಕಿ | தேடு |
| Cause List | वाद सूची | वाद सूची | કોઝ લિસ્ટ | ಪ್ರಕರಣ ಪಟ್ಟಿ | வழக்குப் பட்டியல் |
| Petitioner / Respondent | याचिकाकर्ता / प्रतिवादी | याचिकाकर्ता / प्रतिवादी | અરજદાર / પ્રતિવાદી | ಅರ್ಜಿದಾರ / ಪ್ರತಿವಾದಿ | மனுதாரர் / எதிர்மனுதாரர் |
| Advocate | अधिवक्ता | वकील | વકીલ | ವಕೀಲ | வழக்கறிஞர் |
| Pending / Disposed | लंबित / निस्तारित | प्रलंबित / निकाली | બાકી / નિકાલ થયેલ | ಬಾಕಿ / ವಿಲೇವಾರಿ | நிலுவையில் / தீர்க்கப்பட்டது |
| Civil / Criminal | दीवानी / आपराधिक | दिवाणी / फौजदारी | સિવિલ / ફોજદારી | ಸಿವಿಲ್ / ಕ್ರಿಮಿನಲ್ | உரிமையியல் / குற்றவியல் |
| Interim / Final | अंतरिम / अंतिम | अंतरिम / अंतिम | વચગાળાનો / અંતિમ | ಮಧ್ಯಂತರ / ಅಂತಿಮ | இடைக்கால / இறுதி |
| Caveat | कैविएट | कॅव्हेट | કેવિયેટ | ಕ್ಯಾವಿಯಟ್ | கேவியட் |
| Process (summons, notice, warrant) | प्रक्रिया | प्रक्रिया | પ્રક્રિયા | ಪ್ರಕ್ರಿಯೆ | செயல்முறை |
| Registration / Filing | पंजीकरण / फाइलिंग | नोंदणी / दाखल | નોંધણી / ફાઇલિંગ | ನೋಂದಣಿ / ಸಲ್ಲಿಕೆ | பதிவு / தாக்கல் |
| Hearing | सुनवाई | सुनावणी | સુનાવણી | ವಿಚಾರಣೆ | விசாரணை |
| Demonstration data | प्रदर्शन डेटा | प्रात्यक्षिक माहिती | નિદર્શન માહિતી | ಪ್ರದರ್ಶನ ಡೇಟಾ | செயல்விளக்கத் தரவு |
| Captcha | कैप्चा | कॅप्चा | કેપ્ચા | ಕ್ಯಾಪ್ಚಾ | கேப்ட்சா |

## Kept in Latin letters

CNR, PDF, NJDG, NIC, FIR, IA, URL, WCAG, AAA, SMS, ID, KB, MB, act abbreviations (IPC, CrPC, BNS, BNSS, BSA, CC, CS, WP, MP, CRL), the brand name myCourt, keyboard key names (Enter, Alt, Down Arrow, Esc, Tab), example codes typed into fields (for example TNCH019999992025, MAH/0077/2005), and fictional e-mail and website addresses. The list is `ALLOWED_LATIN` in `src/i18n/core.ts`; a test fails if any other Latin word is left in a translation.

## Not translated

- Fictional people, advocates, judges and case numbers (data, not interface).
- Values that are sent to a search. A state chosen in Hindi is still stored and searched as the English name (see D7 in the plan).

## Choices a reviewer should check first

- **Court**: Hindi and Marathi use न्यायालय; Gujarati uses both અદાલત (formal text) and કોર્ટ (in compound names such as કોર્ટ સંકુલ). Pick one.
- **Cause List**: Gujarati keeps the English words "કોઝ લિસ્ટ" because the Gujarati courts use them; Hindi and Marathi use "वाद सूची".
- **Madras High Court** in Tamil is written சென்னை (the city's current name), which differs from the English "Madras".
- **Check List 138 NI Act Matters** expands "NI Act" to the Negotiable Instruments Act in each language.
- **Process** is the word for a court process (summons, notice, warrant), not a computing process.

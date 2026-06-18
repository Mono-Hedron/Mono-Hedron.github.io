/*
* This code is an extracted part of "Nutshell" originally created by Nicky Case.
* https://ncase.me/nutshell/
* The original "Nutshell" is dedicated to the public domain under CC0 1.0.
*/

export default {
    en: {

        // Button text
        closeAllNutshells: `close all nutshells`,
        learnMore: `learn more about Nutshell`,

        // Nutshell errors...
        notFoundError: `Uh oh, the page was not found! Double check the link:`,
        wikiError: `Uh oh, Wikipedia's not loading, or the link is broken. Please double check:`,
        corsError: `Uh oh, the page was found but didn't hand over its content! Check that the other site has Nutshell installed or CORS enabled:`,
        sectionIDError: `Uh oh, there's no section that matches the ID #[ID]! Watch out for typos & regional spelling differences.`,
        startTextError: `Uh oh, there's no paragraph that has the text “[start]”! Watch out for typos.`,

        // Embed modal!
        embedStep0: `You can embed this as an "expandable explanation" in your own blog/site!
                        Click to preview → [EXAMPLE]`,
        embedStep1: `Step 1) Copy this code into the [HEAD] of your site: [CODE]`,
        embedStep2: `Step 2) In your article, create a link to [LINK]
                        and make sure the link text starts with a :colon,
                        <a href="#">:like this</a>,
                        so Nutshell knows to make it expandable.`,
        embedStep3: `Step 3) That's all, folks! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    eo: {
        // Button text
        closeAllNutshells: `fermu ĉiujn nuksŝeloj`,
        learnMore: `lernu pli`,

        // Nutshell errors...
        notFoundError: `Ho ne, la paĝo ne estis trovita! Kontroli denove la ligilo:`,
        wikiError: `Ho ne, Vikipedio ne ŝargiĝas, aŭ la ligilo estas rompita. Bonvolu kontroli denove:`,
        corsError: `Ho ne, la paĝo estis trovita sed ne transdonis ĝian enhavon! Kontrolu, ke la alia retejo havas Nutshell instalita aŭ CORS ebligita:`,
        sectionIDError: `Ho ne, ne ekzistas sekcio kiu kongruas kun la ID #[ID]! Atentu tajperarojn kaj regionajn literumajn diferencojn.`,
        startTextError: `Ho ne, ne estas paragrafo kiu havas la tekston “[start]”! Atentu tajperarojn.`,

        // Embed modal!
        embedStep0: `Vi povas enmeti ĉi tion kiel "vastigebla klarigo" en via propra blogo/retejo!
                        Klaku por antaŭrigardi → [EXAMPLE]`,
        embedStep1: `Step 1) Kopiu ĉi tiun kodon en la [HEAD] de via retejo: [CODE]`,
        embedStep2: `Step 2) En via artikolo, kreu ligilon al [LINK]
                        kaj certigu, ke la ligteksto komenciĝas per :dupunkto,
                        <a href="#">:kiel tio</a>,
                        por tiu nuksoŝelo sciu certigi, ke ĝi disvastiĝas.`,
        embedStep3: `Step 3) Tio estas ĉio, homoj! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g
    },
    fr: {

        // Button text
        closeAllNutshells: `fermer toutes les Nutshells`,
        learnMore: `en savoir plus`,

        // Nutshell errors...
        notFoundError: `Oh oh, la page n'as pas été trouvée! Lien à vérifier:`,
        wikiError: `Oh oh, Wikipédia n'envoie rien, ou le lien est cassé. S'il vous plaît, vérifiez:`,
        corsError: `Oh oh, la page a été trouvée mais refuse de nous donner son contenu! Vérifiez que l'autre site a Nutshell d'installé ou CORS d'activé:`,
        sectionIDError: `Oh oh, il n'existe pas de section avec l'identifiant #[ID]! Ça pourrait venir d'une faute de frappe ou d'une orthographe d'origine différente.`,
        startTextError: `Oh oh, il n'existe pas de paragraphe contenant “[start]”! Ça pourrait venir d'une faute de frappe.`,

        // Embed modal!
        embedStep0: `Vous pouvez insérer ceci comme "explication expansible" dans votre propre blog/site!
                        Cliquez pour prévisualiser → [EXAMPLE]`,
        embedStep1: `Étape 1) Copiez ce code dans le [HEAD] de votre site: [CODE]`,
        embedStep2: `Étape 2) Dans votre article, créez un lien vers [LINK]
                        et assurez vous que le texte du lien démarre avec :deux-points,
                        <a href="#">:comme ça</a>,
                        pour que Nutshell sache que c'est expansible.`,
        embedStep3: `Étape 3) Et voila! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    nl: {

        // Button text
        closeAllNutshells: `sluit alle Nutshells`,
        learnMore: `leer meer`,

        // Nutshell errors...
        notFoundError: `Uh oh, deze pagina kon niet worden gevonden! Controleer de link nogmaals:`,
        wikiError: `Uh oh, Wikipedia kan niet worden geladen, of de link doet het niet. Controleer nogmaals:`,
        corsError: `Uh oh, de pagina was gevoden, maar wilde zijn content niet doorgeven! Controleer of de andere site Nutshell heeft geïnstalleerd of CORS heeft geactiveerd.`,
        sectionIDError: `Uh oh, er is geen sectie die overeenkomt met ID #[ID]! Let op tikfouten en alternatieve spellingen.`,
        startTextError: `Uh oh, er is geen sectie met de tekst “[start]”! Pas op voor tikfouten.`,

        // Embed modal!
        embedStep0: `Je kunt deze 'uitklapbare uitleg' embedden in je eigen blog/site!
                        Klik voor een voorbeeld → [EXAMPLE]`,
        embedStep1: `Stap 1) Kopieer deze code naar de [HEAD] van je site: [CODE]`,
        embedStep2: `Stap 2) In je artikel, maak een link naar [LINK]
                        en zorg ervoor dat de link start met een :dubbelepunt,
                        <a href="#">:zoals dit</a>,
                        zodat Nutshell weet dat deze link moet uitklappen.`,
        embedStep3: `Stap 3) Dat is alles! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    de: {

        // Button text
        closeAllNutshells: `alle Nutshells schließen`,
        learnMore: `lern mehr`,

        // Nutshell errors...
        notFoundError: `Ups, die Seite konnte nicht gefunden werden! Prüfe den Link nochmals:`,
        wikiError: `Ups, Wikipedia konnt nicht geladen werden, oder der Link ist kaputt. Bitte prüfen:`,
        corsError: `Ups, die Seite wurde gefunden, hat ihren Inhalt jedoch nicht übergeben! Stelle sicher, dass bei der anderen Site Nutshell installiert oder CORS aktiviert ist:`,
        sectionIDError: `Ups, es gibt keine Sektion passend zur ID #[ID]! Prüfe auf Schreibfehler & regionsabhängige Unterschiede der Schreibweise.`,
        startTextError: `Ups, es gibt keinen Absatz mit dem Text “[start]”! Prüfe auf Schreibfehler.`,

        // Embed modal!
        embedStep0: `Du kannst dies als eine "ausklappbare Erklärung" auf deinem eigenen Blog/deiner eigenen Site einbinden!
                        Klick für eine Vorschau → [EXAMPLE]`,
        embedStep1: `Schritt 1) Kopiere diesen Code in den [HEAD] deiner Site: [CODE]`,
        embedStep2: `Schritt 2) Erzeuge einen Link zu [LINK] in deinem Artikel
                        und stelle dabei sicher, dass der Linktext mit einem :Doppelpunkt beginnt,
                        <a href="#">:also so</a>,
                        sodass Nutshell weiß, dass er ausklappbar sein soll.`,
        embedStep3: `Schritt 3) Das wars! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    pl: {

        // Button text
        closeAllNutshells: `zamknij wszystkie nutshelle`,
        learnMore: `Ucz się więcej`,

        // Nutshell errors...
        notFoundError: `Ups, nie znaleziono strony! Sprawdź link ponownie:`,
        wikiError: `Ups, Wikipedia się nie ładuje lub link nie działa. Sprawdź ponownie:`,
        corsError: `Ups, stronę znaleziono, ale nie przekazała ona swojej treści! Sprawdź, czy tamta witryna ma zainstalowany Nutshell lub włączone CORS:`,
        sectionIDError: `Ups, żadna sekcja nie pasuje do identyfikatora #[ID]! Zwróć uwagę na literówki i lokalne różnice w pisowni.`,
        startTextError: `Ups, żaden akapit nie zawiera tekstu “[start]”! Zwróć uwagę na literówki.`,

        // Embed modal!
        embedStep0: `Możesz to umieścić jako "rozszerzalne wyjaśnienie" na swoim blogu lub stronie!
                        Kliknij, aby zobaczyć podgląd → [EXAMPLE]`,
        embedStep1: `Krok 1) Skopiuj ten kod do [HEAD] swojej strony: [CODE]`,
        embedStep2: `Krok 2) Stwórz w swoim artykule link do [LINK]
                        i upewnij się, że tekst linku rozpoczyna się :dwukropkiem,
                        <a href="#">:w ten sposób</a>,
                        żeby Nutshell wiedział, aby umożliwić jego rozszerzanie.`,
        embedStep3: `Krok 3) To by było na tyle! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    es: {

        // Button text
        closeAllNutshells: `cerrar todos los nutshells`,
        learnMore: `aprende más`,

        // Nutshell errors...
        notFoundError: `¡Ups, no se encontró la página! Verifica el link:`,
        wikiError: `Ups, Wikipedia no está cargando, o el link está roto. Verifica:`,
        corsError: `¡Ups, la página se encontró pero esta no entregó su contenido! Verifica que la otra página tenga Nutshell instalado o CORS habilitado:`,
        sectionIDError: `¡Ups, no se ha encontrado la sección con la ID #[ID]! Verifica que no haya errores de tipeo o diferencias regionales de escritura.`,
        startTextError: `¡Ups, no hay ningún párrafo con el texto “[start]”! Verifica que no haya errores de tipeo.`,

        // Embed modal!
        embedStep0: `¡Puedes insertar esto como una “explicación expandible” en tu propio blog o página!
                        Click para previsualizar → [EXAMPLE]`,
        embedStep1: `Paso 1) Copia este código en la [HEAD] de tu sitio: [CODE]`,
        embedStep2: `Paso 2) En tu artículo, añade un link a [LINK]
                        y asegúrate de que el texto del link comience con :dos puntos,
                        <a href="#">:así</a>,
                        para que Nutshell sepa cómo expandirlo.`,
        embedStep3: `Paso 3) ¡Eso es todo, amigos! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    zh: {

        // Button text
        closeAllNutshells: `合上所有的nutshells`,
        learnMore: `学到更多`,

        // Nutshell errors...
        notFoundError: `啊 噢, 没有找到网页！请再次检查链接:`,
        wikiError: `啊 噢, 载入维基百科失败，或者说这个链接是失效了，请再次检查:`,
        corsError: `啊 噢, 网页找到了，但是它并没有交出它的内容！请检查其他站点是否已经安装了Nutshell或者允许跨域资源共享:`,
        sectionIDError: `啊 噢, 并没有段落能匹配这个ID #[ID]! 注意拼写错误 & 地区拼写差异。`,
        startTextError: `啊 噢, 并不存在包含“[start]”文本的段落！请检查拼写错误。`,

        // Embed modal!
        embedStep0: `你可以将此作为一个可展开的说明嵌入你自己的博客/站点！
                        点击右侧链接来预览 → [EXAMPLE]`,
        embedStep1: `第一步)复制这段代码至你站点的[HEAD]中: [CODE]`,
        embedStep2: `第二步)在你的文章中，创建一个链接链接至[LINK]
                        并确保链接中的文本以:冒号开头,
                        <a href="#">:就像这样</a>,
                        这样，Nutshell就知道要使其可展开。`,
        embedStep3: `第三步)就这么多，家人们! 🎉`,


        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `。.,?!)_~'"’”`, // added chinese period
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[。.?!]\s/g // added chinese period

    },
    he: {
        // Button text
        closeAllNutshells: `סגור את כל האגוזים`,
        learnMore: `עוד אודות קליפת האגוז`,

        // Nutshell errors...
        notFoundError: `:אוי לא, הדף לא נמצא! בדקו שוב את הקישור`,
        wikiError: `:אוי לא, ויקיפדיה לא טוען, או שהלינק לא תקין. בבקשה בדקו שוב`,
        corsError: `:מופעל CORS מותקן או nutshell אוי לא, העמוד נמצא אך לא איפשר גישה לתוכן! בדקו אם לאתר יש `,
        sectionIDError: `.בדקו שגיאות כתיב והבדלי איות אזוריים ! #[ID] IDאוי לא, אין סעיף אשר תואם את ה`,
        startTextError: `.הזהרו משגיאות כתיב !“[start]” אוי לא, אין פסקה עם הטקסט`,

        // Embed modal!
        embedStep0: `!אתם יכול להטמיע זאת כ"הסבר הניתן להרחבה" בבלוג/אתר שלכם
                        [EXAMPLE] ← לחצו לתצוגה מוקדמת`,
        embedStep1: `[CODE] :של האתר שלכם [HEAD]צעד 1) העתיקו את הקוד הזה לתוך ה`,
        embedStep2: `[LINK]צעד 2) במאמר שלכם, תיצרו קישור ל
                        ודאגו שהטקסט של הלינק מתחיל עם :נקודותיים,
                        <a href="#">:ככה</a>
                        .ידע לעשות אותו ניתן להרחבה Nutshellכך ש`,
        embedStep3: `🎉 !צעד 3) זה הכל, חברים`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g
    },
    tr: {

        // Button text
        closeAllNutshells: `tüm Nutshell'leri kapat`,
        learnMore: `Nutshell hakkında daha fazla şey öğren`,

        // Nutshell errors...
        notFoundError: `Ah, sayfa bulunamadı! Linki tekrar kontrol edin:`,
        wikiError: `Ah, Wikipedia yüklenmiyor veya link bozuk. Lütfen tekrar kontrol edin:`,
        corsError: `Ah, sayfa bulundu ama içeriği görüntüleyemiyoruz! Diğer sitede de Nutshell'in kurulu veya CORS'un etkin olduğundan emin olunuz:`,
        sectionIDError: `Ah, #[ID] kimliğiyle eşleşen bir bölüm yok! Yazım hatalarına ve bölgesel yazım farklılıklarına dikkat edin.`,
        startTextError: `Ah, “[start]” metnine sahip bir paragraf yok! Yazım hatalarına dikkat edin.`,

        // Embed modal!
        embedStep0: `Bunu kendi web günlüğünüze/sitenize "genişletilebilir bir açıklama" olarak yerleştirebilirsiniz!
                        Önizlemek için tıklayın → [EXAMPLE]`,
        embedStep1: `Adım 1) Bu kodu sitenizin [HEAD] bölümüne kopyalayın: [CODE]`,
        embedStep2: `Adım 2) İçeriğinizde [LINK] için bir bağlantı oluşturun
                        ve bağlantı metninin :iki nokta ile başladığından emin olun
                        <a href="#">:bu şekilde</a>,
                        böylece Nutshell onu genişletmesi gerektiğini anlar.`,
        embedStep3: `Adım 3) İşte, hepsi bu kadar! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    ko: {

        // Button text
        closeAllNutshells: `껍질 모두 닫기`,
        learnMore: `껍질에 대해 더 배우기`,

        // Nutshell errors...
        notFoundError: `이런, 페이지를 찾지 못했어요! 주소를 다시 확인하세요:`,
        wikiError: `이런, 위키피디아가 로딩이 안 되거나 주소가 망가졌어요. 다시 확인해 주세요:`,
        corsError: `이런, 페이지를 찾았지만 내용물을 주지 않았어요! 그 다른 사이트가 껍질이 설치되었거나 CORS가 작동됐는지 확인하세요:`,
        sectionIDError: `이런, ID #[ID]에 맞는 부분이 없어요! 오타나 지역적인 철자의 차이를 주의하세요.`,
        startTextError: `이런, “[start]”라는 글이 있는 단락이 없어요! 오타를 주의하세요.`,

        // Embed modal!
        embedStep0: `이것을 당신의 블로그/사이트에 "펼칠 수 있는 설명"으로 첨부할 수 있어요!
                        눌러서 미리보기 → [EXAMPLE]`,
        embedStep1: `1) 이 코드를 당신의 사이트의 [HEAD]에 복사하세요: [CODE]`,
        embedStep2: `2) 당신의 글에 [LINK]로 가는 링크를 넣으세요
                        그리고 링크가 반드시 :쌍점으로 시작하게 하세요,
                        <a href="#">:이렇게</a>,
                        그래야지 프로그램이 이걸 펼칠 수 있게 만들어야 하는 걸 압니다.`,
        embedStep3: `3) 그게 다에요! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    hi: {

        // Button text
        closeAllNutshells: `सारे नटशेल्स बंद करे`,
        learnMore: `नटशेल के विषय में और जाने`,

        // Nutshell errors...
        notFoundError: `उह ओह, खोजा हुआ पेज नहीं मिला! लिंक को दोबारा जांचें:`,
        wikiError: `उह ओह, विकिपीडिया लोड नहीं हो रहा है, या लिंक टूटा हुआ है। कृपया लिंक की दोबारा जांच करें:`,
        corsError: `उह ओह, पेज  मिल गया लेकिन उससे  कंटेंट  नहीं मिल पाया हैः ! जांचें कि दूसरी साइट में नटशेल इन्सटाल्ड है या  CORS चालू है? :`,
        sectionIDError: `उह ओह, ऐसा कोई खंड नहीं है जो ID #[ID]! से मेल खाता हो! टाइपो और क्षेत्रीय स्पेलिंग अंतरों के लिए देखें।`,
        startTextError: `उह ओह, ऐसा कोई पैराग्राफ  नहीं है जिसमें टेक्स्ट "[start]" हो! टाइपिंग मिस्टेक की जांच करे ।`,

        // Embed modal!
        embedStep0: `आप इसे अपने स्वयं के ब्लॉग/साइट में "एक्सपेंडबल एक्सप्लनेशन (विस्तार योग्य स्पष्टीकरण)" के रूप में एम्बेड कर सकते हैं!
                        प्रीव्यू के लिए क्लिक करें → [EXAMPLE]`,
        embedStep1: `स्टेप  1) इस कोड को अपनी साइट के [HEAD] में कॉपी करें: [CODE]`,
        embedStep2: `स्टेप  2) अपने आर्टिकल  में, [LINK] के लिए एक लिंक बनाएँ
                        और सुनिश्चित करें कि लिंक टेक्स्ट एक :colon से शुरू होता है,
                        <a href="#">:इस तरह</a>,
                        तो नटशेल में इसे एक्सपेंडेनब्ल (विस्तार योग्य) बनाना जानता है।`,
        embedStep3: `स्टेप  3) बस इतना करके आप नटशेल यूज़ कर पाएंगे ! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `।.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[।?,.]\s/g

    },
    ru: {

        // Button text
        closeAllNutshells: `закрыть все пояснения`,
        learnMore: `узнать больше про Nutshell`,

        // Nutshell errors...
        notFoundError: `О нет, страница не найдена! Перепроверьте, что ссылка правильная:`,
        wikiError: `О нет, Википедия не загружается, или ссылка битая. Пожалуйста, перепроверьте её:`,
        corsError: `О нет, страница найдена, но не отдаёт содержимое! Проверьте, что на другом сайте установлен Nutshell или включён CORS:`,
        sectionIDError: `О нет, раздела с идентификатором #[ID] не существует! Проверьте, что вы не опечатались и учли все орфографические особенности.`,
        startTextError: `О нет, абзаца с текстом «[start]» не существует! Проверьте, что вы не опечатались.`,

        // Embed modal!
        embedStep0: `Вы можете встроить это «разворачиваемое пояснение» в свой собственный блог или сайт!
                        Нажмите для предпросмотра → [EXAMPLE]`,
        embedStep1: `Шаг 1) Скопируйте этот код в элемент [HEAD] на вашем сайте: [CODE]`,
        embedStep2: `Шаг 2) На нужной странице сделайте ссылку на [LINK]
                        и убедитесь, что текст ссылки начинается с :двоеточия,
                        <a href="#">:вот так</a>,
                        чтобы Nutshell знал, что её можно развернуть.`,
        embedStep3: `Шаг 3) Вот и всё! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”»`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g

    },
    vi: {

        // Button text
        closeAllNutshells: `đóng tất cả các nutshell`,
        learnMore: `tìm hiểu thêm về Nutshell`,

        // Nutshell errors...
        notFoundError: `Ôi không, không thể tìm thấy trang! Kiểm tra lại link:`,
        wikiError: `Ôi không, có thể Wikipedia bị hư, hoặc trang không tồn tại. Kiểm tra lại link:`,
        corsError: `Ôi không, trang tồn tại nhưng không cho phép truy cập! Kiểm tra trang đã tải Nutshell hay bật CORS chưa:`,
        sectionIDError: `Ôi không, không có phần nào được gán ID #[ID]! Kiểm tra lỗi chính tả.`,
        startTextError: `Ôi không, không có đoạn nào có câu “[start]”! Kiểm tra lỗi chính tả.`,

        // Embed modal!
        embedStep0: `Bạn có thể nhúng phần này như là phần "giải thích mở rộng" trên website của bạn!
                        Click để xem thử → [EXAMPLE]`,
        embedStep1: `Step 1) Copy code này vào phần [HEAD] trong website của bạn: [CODE]`,
        embedStep2: `Step 2) Trong bài viết của bạn, tạo đường link tới [LINK]
                        và luôn luôn đặt dấu :hai chấm phía trước đường link,
                        <a href="#">:như thế này</a>,
                        để Nutshell biết mở rộng phần này.`,
        embedStep3: `Step 3) Xong rồi đấy! 🎉`,

        // What punctuation (in this language) should we KEEP after an expandable opens?
        keepPunctuation: `.,?!)_~'"’”`,
        // What punctuation (in this language) signifies the END of a sentence? Note, this is a regex.
        endPunctuation: /[.?!]\s/g
    },
};

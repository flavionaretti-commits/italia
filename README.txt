ITALIA! – PWA v2.2

CONTENUTO
- Regioni
- Capoluoghi di regione
- Capoluoghi di provincia (versione scolastica tradizionale)
- Italia fisica: mari, laghi, fiumi, monti, vulcani, isole, stretti/golfi/promontori
- Meraviglie d'Italia: monumenti, città d'arte e luoghi celebri, archeologia, natura
- Domande Nome → carta e Carta → nome
- Risposte orali con MOSTRA RISPOSTA
- Punteggio di precisione per elementi puntuali, lineari e areali
- 1–6 giocatori, stesso numero di domande per ciascuno
- Timer opzionale con bonus velocità
- Allenamento continuo
- Modalità giorno/notte, suoni, regolamento, info e crediti
- Dati e impostazioni locali sul dispositivo
- PWA offline tramite service worker

V2
Il logo tricolore in alto a sinistra esegue periodicamente una breve animazione di sventolio.

CREDITI
Idea e progetto didattico: Flavio Naretti
Sviluppo: ChatGPT / OpenAI

V2.1
- I capoluoghi regionali non vengono più riproposti come "capoluoghi di provincia": le due categorie sono ora didatticamente separate.
- Nuova modalità STUDIA I CAPOLUOGHI con tutti i punti sulla carta: arancione per i capoluoghi di regione, azzurro per gli altri capoluoghi di provincia; toccando un punto compare il nome.
- Nelle Meraviglie d'Italia compare un riquadro fotografico nell'angolo superiore destro della carta. Le miniature sono cercate su Wikipedia/Wikimedia, vengono conservate dalla cache del browser e hanno un fallback locale.

V2.2
- Modalità MAPPA a tutto schermo durante gioco e studio, ottimizzata anche per iPad in verticale.
- Zoom affidabile con pulsanti + / − / reset, fino a 6×.
- Pinch a due dita gestito direttamente dalla mappa; trascinamento con un dito quando la carta è ingrandita.
- Apple Pencil lasciata libera per il tap preciso: la penna non attiva il trascinamento della carta.

V2.2.1
- Migliorata la posizione dei capoluoghi di provincia sulla carta: la proiezione geografica viene ora corretta localmente usando i 20 capoluoghi regionali già calibrati come punti di riferimento.
- La modifica riguarda solo le coordinate dei capoluoghi provinciali e non cambia regioni, punteggi, modalità Studio, Italia fisica o Meraviglie.

V2.2.2
- Corretto l'abbinamento delle immagini delle Meraviglie d'Italia.
- Eliminata la ricerca generica su Wikipedia: ciascuna delle 54 meraviglie è ora associata a una pagina Wikipedia precisa.
- Se una pagina non fornisce una miniatura valida, l'app mostra il riquadro grafico di riserva invece di una fotografia potenzialmente sbagliata.

V2.2.3
- Micro-correzione manuale dei quattro capoluoghi liguri sulla carta, senza alterare la calibrazione generale:
  Genova -12 px in verticale, Imperia -10 px, Savona -10 px, La Spezia -8 px.
- La correzione vale sia nel gioco sia nella modalità Studio.

V2.2.4
- Rifinitura manuale delle posizioni cittadine sulla carta:
  Imperia, Genova e La Spezia più a nord; Massa e Livorno più a est;
  Venezia più a ovest; Messina più a sud; Reggio Calabria più a nord.
- Savona resta sulla calibrazione già approvata.

V2.2.5
- Nella modalità STUDIA I CAPOLUOGHI è disponibile il pulsante RIPOSIZIONA.
- Con RIPOSIZIONA attivo i puntini possono essere trascinati con dito o Apple Pencil.
- Le correzioni vengono salvate in localStorage sul dispositivo e vengono riutilizzate anche nelle domande del gioco.
- Il pulsante RIPRISTINA cancella tutte le correzioni personali e torna alle coordinate predefinite dell'app.

V2.2.6
- Aggiunto ESPORTA POSIZIONI nella modalità Studio.
- Esporta le sole correzioni manuali dei capoluoghi in italia-coordinate-capoluoghi.json, includendo sia gli spostamenti dx/dy sia le coordinate finali x/y.
- Su iPad/iPhone usa il foglio Condividi quando disponibile; altrimenti scarica il JSON.
- Il file può essere inviato in chat per trasferire le correzioni nella versione GitHub dell'app.

V2.2.7
- Incorporate nella versione ufficiale le 100 correzioni dei capoluoghi esportate dalla calibrazione manuale su iPad del 27/09/2026.
- Le correzioni precedentemente salvate in locale vengono azzerate una sola volta al passaggio a questa versione, per evitare che gli spostamenti vengano applicati due volte.
- RIPOSIZIONA ed ESPORTA POSIZIONI restano disponibili per eventuali rifiniture successive.

V2.2.8
- Rimossi i bordi chiari/scuri attorno ai puntini blu e arancioni dei capoluoghi nella modalità Studio, sia in tema giorno sia in tema notte.
- Anche hover/focus non aggiungono più un bordo spesso; resta solo un leggero rilievo per mantenere leggibile il punto.
- In modalità RIPOSIZIONA il bordo di evidenziazione resta attivo, perché serve a distinguere i punti trascinabili.

V2.2.9
- Aggiunta la modalità STUDIA LE REGIONI: toccando una regione questa si evidenzia e mostra il proprio nome; selezionandone un'altra la precedente torna normale.
- Nella modalità STUDIA I CAPOLUOGHI le sagome regionali non sono più interattive, evitando il rettangolo di focus quando si tocca uno spazio vuoto.
- Le due modalità di studio sono ora separate per rendere più chiaro l'obiettivo didattico.

V2.2.10
- Corretto il blocco totale causato da possibili versioni miste di index.html e app.js durante l'aggiornamento della PWA.
- Gli asset principali ora hanno un identificatore di versione nell'URL, così una nuova pagina non può caricare per errore JavaScript vecchio dalla cache.
- Il service worker usa rete-prima per navigazione e file core quando online, con fallback alla cache offline.
- Il nuovo pulsante STUDIA LE REGIONI è registrato in modo tollerante: anche se un vecchio HTML fosse ancora visibile per un istante, non può più interrompere l'avvio di tutta l'app.

V2.2.11
- Corretto il vero errore runtime che bloccava ogni modalità sulla schermata segnaposto "Trova il Piemonte".
- resetMapVisuals e Studio regioni chiamavano forEach su querySelector (un solo elemento) invece che su una lista di regioni.
- Eseguiti smoke test delle tre entrate principali: gioco, Studia i capoluoghi, Studia le regioni.
- Asset versionati a 2211 per forzare il caricamento del JavaScript corretto.

V2.2.12
- Corretto un problema specifico desktop nella mappa a tutto schermo della modalità STUDIA LE REGIONI.
- Il mouse non usa più la pointer capture al semplice click, quindi il click resta associato alla singola regione.
- Su desktop la pointer capture viene attivata solo quando il mouse viene effettivamente trascinato per spostare una mappa già zoomata.
- Il comportamento touch/Apple Pencil di iPad e smartphone resta invariato.

V2.2.13
- Uniformata la selezione dei capoluoghi tra PC e iPad.
- Eliminato il quadratino di focus nativo che compariva con il mouse sul desktop.
- Il capoluogo selezionato mostra ora un sottile anello dorato esterno, senza coprire il puntino blu/arancione.
- L'anello compare anche con Apple Pencil e scompare automaticamente quando si seleziona un altro capoluogo.

V2.2.14
- Incorporate 53 ultime rifiniture manuali dei capoluoghi esportate il 27/09/2026.
- Le nuove correzioni sono state sommate alla calibrazione ufficiale precedente, mantenendo inalterati i capoluoghi non ritoccati.
- Aggiunte alla calibrazione ufficiale anche città prima senza offset esplicito, tra cui Napoli, Sassari e Verona.
- Aggiornata la versione della calibrazione locale a 2.2.14: i vecchi delta locali vengono cancellati una sola volta per evitare doppie correzioni.
- Corretto anche il percorso dei capoluoghi di regione nel quiz affinché l'offset ufficiale venga applicato una sola volta.

V2.2.15
- Aggiunta modalità STUDIA I LUOGHI FAMOSI.
- Mostra tutte le 54 Meraviglie d'Italia sulla stessa carta con filtri indipendenti per Monumenti, Città d'arte e luoghi celebri, Archeologia e Natura.
- Toccando un punto vengono mostrati nome, categoria e immagine associata.
- Aggiunti RIPOSIZIONA, ESPORTA POSIZIONI e RIPRISTINA anche per i luoghi famosi.
- Le correzioni dei luoghi famosi sono salvate separatamente in localStorage e vengono applicate immediatamente anche alle domande del gioco.
- ESPORTA POSIZIONI produce italia-coordinate-luoghi-famosi.json, pronto per incorporare successivamente le coordinate definitive nella repository.

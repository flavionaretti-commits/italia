const REGIONS=[
{name:"Valle d'Aosta",capital:"Aosta",x:105,y:225},{name:"Piemonte",capital:"Torino",x:112,y:330},
{name:"Liguria",capital:"Genova",x:250,y:452},{name:"Lombardia",capital:"Milano",x:336,y:283},
{name:"Trentino-Alto Adige",capital:"Trento",x:507,y:155},{name:"Veneto",capital:"Venezia",x:620,y:307},
{name:"Friuli-Venezia Giulia",capital:"Trieste",x:726,y:216},{name:"Emilia-Romagna",capital:"Bologna",x:506,y:430},
{name:"Toscana",capital:"Firenze",x:492,y:540},{name:"Marche",capital:"Ancona",x:748,y:570},
{name:"Umbria",capital:"Perugia",x:635,y:630},{name:"Lazio",capital:"Roma",x:643,y:792},
{name:"Abruzzo",capital:"L'Aquila",x:760,y:730},{name:"Molise",capital:"Campobasso",x:855,y:816},
{name:"Campania",capital:"Napoli",x:828,y:940},{name:"Puglia",capital:"Bari",x:1080,y:875},
{name:"Basilicata",capital:"Potenza",x:1018,y:985},{name:"Calabria",capital:"Catanzaro",x:1110,y:1180},
{name:"Sardegna",capital:"Cagliari",x:245,y:1180},{name:"Sicilia",capital:"Palermo",x:725,y:1360}
];

const PROVINCES_ROWS=[
"Aosta|45.737|7.321|Valle d'Aosta","Torino|45.070|7.687|Piemonte","Alessandria|44.913|8.615|Piemonte","Asti|44.900|8.207|Piemonte",
"Biella|45.563|8.057|Piemonte","Cuneo|44.384|7.542|Piemonte","Novara|45.446|8.622|Piemonte","Verbania|45.921|8.551|Piemonte","Vercelli|45.323|8.423|Piemonte",
"Genova|44.405|8.946|Liguria","Imperia|43.887|8.030|Liguria","La Spezia|44.102|9.824|Liguria","Savona|44.307|8.481|Liguria",
"Milano|45.464|9.190|Lombardia","Bergamo|45.698|9.677|Lombardia","Brescia|45.541|10.212|Lombardia","Como|45.808|9.085|Lombardia","Cremona|45.133|10.022|Lombardia",
"Lecco|45.856|9.397|Lombardia","Lodi|45.314|9.503|Lombardia","Mantova|45.156|10.791|Lombardia","Monza|45.584|9.274|Lombardia","Pavia|45.185|9.158|Lombardia",
"Sondrio|46.170|9.870|Lombardia","Varese|45.820|8.825|Lombardia","Bolzano|46.499|11.354|Trentino-Alto Adige","Trento|46.074|11.121|Trentino-Alto Adige",
"Belluno|46.139|12.217|Veneto","Padova|45.406|11.876|Veneto","Rovigo|45.071|11.790|Veneto","Treviso|45.667|12.245|Veneto","Venezia|45.440|12.315|Veneto",
"Verona|45.438|10.992|Veneto","Vicenza|45.545|11.540|Veneto","Gorizia|45.940|13.620|Friuli-Venezia Giulia","Pordenone|45.956|12.661|Friuli-Venezia Giulia",
"Trieste|45.650|13.770|Friuli-Venezia Giulia","Udine|46.071|13.234|Friuli-Venezia Giulia","Bologna|44.494|11.342|Emilia-Romagna","Ferrara|44.838|11.620|Emilia-Romagna",
"Forlì|44.222|12.041|Emilia-Romagna","Modena|44.647|10.925|Emilia-Romagna","Parma|44.801|10.328|Emilia-Romagna","Piacenza|45.052|9.693|Emilia-Romagna",
"Ravenna|44.418|12.203|Emilia-Romagna","Reggio Emilia|44.699|10.631|Emilia-Romagna","Rimini|44.067|12.570|Emilia-Romagna",
"Firenze|43.769|11.255|Toscana","Arezzo|43.463|11.880|Toscana","Grosseto|42.761|11.114|Toscana","Livorno|43.548|10.311|Toscana","Lucca|43.843|10.505|Toscana",
"Massa|44.036|10.142|Toscana","Pisa|43.716|10.401|Toscana","Pistoia|43.933|10.917|Toscana","Prato|43.880|11.096|Toscana","Siena|43.319|11.332|Toscana",
"Perugia|43.110|12.390|Umbria","Terni|42.563|12.643|Umbria","Ancona|43.616|13.518|Marche","Ascoli Piceno|42.854|13.575|Marche","Fermo|43.160|13.718|Marche",
"Macerata|43.299|13.453|Marche","Pesaro|43.910|12.913|Marche","Roma|41.903|12.496|Lazio","Frosinone|41.639|13.342|Lazio","Latina|41.467|12.904|Lazio",
"Rieti|42.403|12.860|Lazio","Viterbo|42.417|12.108|Lazio","L'Aquila|42.350|13.399|Abruzzo","Chieti|42.351|14.167|Abruzzo","Pescara|42.461|14.216|Abruzzo",
"Teramo|42.659|13.704|Abruzzo","Campobasso|41.560|14.668|Molise","Isernia|41.596|14.233|Molise","Napoli|40.852|14.268|Campania","Avellino|40.914|14.790|Campania",
"Benevento|41.130|14.780|Campania","Caserta|41.073|14.332|Campania","Salerno|40.682|14.768|Campania","Bari|41.117|16.871|Puglia","Barletta|41.320|16.281|Puglia",
"Andria|41.231|16.295|Puglia","Trani|41.277|16.417|Puglia","Brindisi|40.632|17.941|Puglia","Foggia|41.462|15.545|Puglia","Lecce|40.352|18.175|Puglia",
"Taranto|40.464|17.247|Puglia","Potenza|40.640|15.805|Basilicata","Matera|40.667|16.604|Basilicata","Catanzaro|38.910|16.588|Calabria","Cosenza|39.299|16.253|Calabria",
"Crotone|39.080|17.127|Calabria","Reggio Calabria|38.111|15.647|Calabria","Vibo Valentia|38.676|16.100|Calabria","Palermo|38.116|13.361|Sicilia","Agrigento|37.311|13.576|Sicilia",
"Caltanissetta|37.490|14.060|Sicilia","Catania|37.507|15.083|Sicilia","Enna|37.567|14.280|Sicilia","Messina|38.193|15.554|Sicilia","Ragusa|36.926|14.725|Sicilia",
"Siracusa|37.075|15.286|Sicilia","Trapani|38.017|12.536|Sicilia","Cagliari|39.224|9.122|Sardegna","Carbonia|39.167|8.522|Sardegna","Nuoro|40.321|9.329|Sardegna",
"Oristano|39.905|8.591|Sardegna","Sassari|40.725|8.555|Sardegna"
];

const slug=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const PROVINCES=PROVINCES_ROWS.map(row=>{const [name,lat,lon,region]=row.split("|");return{id:"prov-"+slug(name),name,lat:+lat,lon:+lon,region,kind:"point",cat:"provinces",tolerance:8,maxDistance:250};});

const F=(id,name,sub,kind,data={})=>({id:"phys-"+id,name,sub,kind,cat:"physical",...data});
const PHYSICAL=[
F("ligure","Mar Ligure","seas","area",{lat:43.35,lon:8.55,radiusKm:115}),F("tirreno","Mar Tirreno","seas","area",{lat:40.45,lon:11.55,radiusKm:205}),
F("adriatico","Mar Adriatico","seas","area",{lat:43.10,lon:15.00,radiusKm:185}),F("ionio","Mar Ionio","seas","area",{lat:38.55,lon:17.15,radiusKm:150}),
F("sardegna","Mar di Sardegna","seas","area",{lat:39.70,lon:7.35,radiusKm:130}),F("sicilia","Canale di Sicilia","seas","area",{lat:36.55,lon:13.10,radiusKm:105}),
F("garda","Lago di Garda","lakes","point",{lat:45.63,lon:10.67,tolerance:18,maxDistance:190}),F("maggiore","Lago Maggiore","lakes","point",{lat:45.95,lon:8.63,tolerance:18,maxDistance:190}),
F("como","Lago di Como","lakes","point",{lat:46.00,lon:9.27,tolerance:15,maxDistance:180}),F("iseo","Lago d'Iseo","lakes","point",{lat:45.72,lon:10.07,tolerance:13,maxDistance:170}),
F("trasimeno","Lago Trasimeno","lakes","point",{lat:43.14,lon:12.10,tolerance:15,maxDistance:180}),F("bolsena","Lago di Bolsena","lakes","point",{lat:42.60,lon:11.93,tolerance:13,maxDistance:170}),
F("bracciano","Lago di Bracciano","lakes","point",{lat:42.12,lon:12.23,tolerance:12,maxDistance:160}),F("orta","Lago d'Orta","lakes","point",{lat:45.80,lon:8.40,tolerance:10,maxDistance:150}),
F("varano","Lago di Varano","lakes","point",{lat:41.87,lon:15.75,tolerance:12,maxDistance:160}),F("lesina","Lago di Lesina","lakes","point",{lat:41.88,lon:15.43,tolerance:12,maxDistance:160}),
F("po","Po","rivers","line",{points:[[44.67,7.09],[45.07,7.69],[45.14,8.45],[45.05,9.69],[45.13,10.02],[45.05,10.80],[44.84,11.62],[44.95,12.47]],tolerance:22,maxDistance:190}),
F("adige","Adige","rivers","line",{points:[[46.83,10.51],[46.50,11.35],[46.07,11.12],[45.44,10.99],[45.10,11.70],[45.16,12.30]],tolerance:20,maxDistance:180}),
F("tevere","Tevere","rivers","line",{points:[[43.79,12.07],[43.46,12.24],[42.78,12.40],[41.90,12.49],[41.73,12.28]],tolerance:20,maxDistance:180}),
F("arno","Arno","rivers","line",{points:[[43.86,11.71],[43.47,11.88],[43.77,11.25],[43.72,10.95],[43.72,10.40]],tolerance:20,maxDistance:180}),
F("piave","Piave","rivers","line",{points:[[46.63,12.72],[46.14,12.22],[46.02,11.91],[45.70,12.40],[45.53,12.72]],tolerance:20,maxDistance:180}),
F("ticino","Ticino","rivers","line",{points:[[46.47,8.44],[45.95,8.63],[45.18,9.16],[45.13,9.15]],tolerance:20,maxDistance:170}),
F("adda","Adda","rivers","line",{points:[[46.47,10.37],[46.17,9.87],[45.86,9.40],[45.31,9.50],[45.14,9.87]],tolerance:20,maxDistance:170}),
F("oglio","Oglio","rivers","line",{points:[[46.25,10.45],[45.72,10.07],[45.30,10.35],[45.05,10.50]],tolerance:20,maxDistance:170}),
F("reno","Reno","rivers","line",{points:[[44.10,10.80],[44.49,11.34],[44.75,11.60],[44.60,12.25]],tolerance:20,maxDistance:170}),
F("volturno","Volturno","rivers","line",{points:[[41.65,14.05],[41.30,14.20],[41.07,14.33],[41.02,13.92]],tolerance:20,maxDistance:170}),
F("ofanto","Ofanto","rivers","line",{points:[[41.05,15.50],[41.00,16.00],[41.20,16.30],[41.31,16.08]],tolerance:20,maxDistance:170}),
F("ombrone","Ombrone","rivers","line",{points:[[43.10,11.50],[42.80,11.40],[42.65,11.10],[42.67,10.95]],tolerance:20,maxDistance:170}),
F("basento","Basento","rivers","line",{points:[[40.65,15.80],[40.50,16.20],[40.40,16.70],[40.36,16.82]],tolerance:20,maxDistance:170}),
F("simeto","Simeto","rivers","line",{points:[[37.75,14.70],[37.55,14.95],[37.40,15.06]],tolerance:20,maxDistance:170}),
F("monte-bianco","Monte Bianco","mountains","point",{lat:45.832,lon:6.865,tolerance:15,maxDistance:210}),F("monte-rosa","Monte Rosa","mountains","point",{lat:45.936,lon:7.866,tolerance:15,maxDistance:210}),
F("cervino","Cervino","mountains","point",{lat:45.977,lon:7.658,tolerance:15,maxDistance:210}),F("gran-paradiso","Gran Paradiso","mountains","point",{lat:45.536,lon:7.267,tolerance:15,maxDistance:210}),
F("monviso","Monviso","mountains","point",{lat:44.667,lon:7.090,tolerance:15,maxDistance:210}),F("ortles","Ortles","mountains","point",{lat:46.508,lon:10.544,tolerance:15,maxDistance:210}),
F("adamello","Adamello","mountains","point",{lat:46.155,lon:10.497,tolerance:15,maxDistance:210}),F("marmolada","Marmolada","mountains","point",{lat:46.434,lon:11.862,tolerance:15,maxDistance:210}),
F("monte-baldo","Monte Baldo","mountains","point",{lat:45.730,lon:10.840,tolerance:15,maxDistance:210}),F("cimone","Monte Cimone","mountains","point",{lat:44.193,lon:10.701,tolerance:15,maxDistance:210}),
F("falterona","Monte Falterona","mountains","point",{lat:43.866,lon:11.708,tolerance:15,maxDistance:210}),F("vettore","Monte Vettore","mountains","point",{lat:42.824,lon:13.275,tolerance:15,maxDistance:210}),
F("gran-sasso","Gran Sasso","mountains","point",{lat:42.469,lon:13.565,tolerance:18,maxDistance:220}),F("terminillo","Terminillo","mountains","point",{lat:42.473,lon:12.997,tolerance:15,maxDistance:210}),
F("amiata","Monte Amiata","mountains","point",{lat:42.890,lon:11.626,tolerance:15,maxDistance:210}),F("pollino","Massiccio del Pollino","mountains","point",{lat:39.900,lon:16.200,tolerance:22,maxDistance:230}),
F("aspromonte","Aspromonte","mountains","point",{lat:38.160,lon:15.920,tolerance:22,maxDistance:230}),F("gennargentu","Gennargentu","mountains","point",{lat:39.990,lon:9.324,tolerance:22,maxDistance:230}),
F("vesuvio","Vesuvio","volcanoes","point",{lat:40.822,lon:14.428,tolerance:12,maxDistance:190}),F("etna","Etna","volcanoes","point",{lat:37.751,lon:14.993,tolerance:15,maxDistance:200}),
F("stromboli","Stromboli","volcanoes","point",{lat:38.789,lon:15.213,tolerance:10,maxDistance:180}),F("vulcano","Vulcano","volcanoes","point",{lat:38.404,lon:14.962,tolerance:10,maxDistance:180}),
F("campi-flegrei","Campi Flegrei","volcanoes","point",{lat:40.827,lon:14.139,tolerance:14,maxDistance:190}),
F("sicilia-isola","Sicilia","islands","area",{lat:37.60,lon:14.00,radiusKm:100,maxDistance:210}),F("sardegna-isola","Sardegna","islands","area",{lat:40.00,lon:9.00,radiusKm:88,maxDistance:200}),
F("elba","Isola d'Elba","islands","area",{lat:42.78,lon:10.28,radiusKm:15,maxDistance:150}),F("ischia","Ischia","islands","area",{lat:40.73,lon:13.90,radiusKm:9,maxDistance:140}),
F("capri","Capri","islands","area",{lat:40.55,lon:14.24,radiusKm:7,maxDistance:140}),F("pantelleria","Pantelleria","islands","area",{lat:36.83,lon:11.95,radiusKm:12,maxDistance:160}),
F("lampedusa","Lampedusa","islands","area",{x:675,y:1572,radiusKm:10,maxDistance:160}),F("lipari","Lipari","islands","area",{lat:38.47,lon:14.95,radiusKm:8,maxDistance:140}),
F("messina","Stretto di Messina","coasts","area",{lat:38.24,lon:15.63,radiusKm:22,maxDistance:150}),F("bonifacio","Bocche di Bonifacio","coasts","area",{lat:41.23,lon:9.15,radiusKm:30,maxDistance:160}),
F("golfo-genova","Golfo di Genova","coasts","area",{lat:44.25,lon:8.75,radiusKm:62,maxDistance:180}),F("golfo-venezia","Golfo di Venezia","coasts","area",{lat:45.20,lon:12.90,radiusKm:70,maxDistance:190}),
F("golfo-napoli","Golfo di Napoli","coasts","area",{lat:40.75,lon:14.20,radiusKm:38,maxDistance:160}),F("golfo-taranto","Golfo di Taranto","coasts","area",{lat:40.10,lon:17.20,radiusKm:72,maxDistance:190}),
F("gargano","Promontorio del Gargano","coasts","point",{lat:41.80,lon:16.00,tolerance:25,maxDistance:190}),F("circeo","Promontorio del Circeo","coasts","point",{lat:41.23,lon:13.05,tolerance:18,maxDistance:170})
];

const W=(id,name,sub,lat,lon)=>({id:"wonder-"+id,name,sub,lat,lon,kind:"point",cat:"wonders",tolerance:8,maxDistance:220});
const WONDERS=[
W("colosseo","Colosseo","monuments",41.890,12.492),W("san-pietro","Basilica di San Pietro","monuments",41.902,12.453),W("trevi","Fontana di Trevi","monuments",41.901,12.483),
W("duomo-milano","Duomo di Milano","monuments",45.464,9.191),W("mole","Mole Antonelliana","monuments",45.069,7.693),W("san-marco","Piazza San Marco","monuments",45.434,12.339),
W("arena-verona","Arena di Verona","monuments",45.439,10.994),W("torre-pisa","Torre di Pisa","monuments",43.723,10.396),W("duomo-firenze","Duomo di Firenze","monuments",43.773,11.256),
W("ponte-vecchio","Ponte Vecchio","monuments",43.768,11.254),W("reggia-caserta","Reggia di Caserta","monuments",41.073,14.327),W("castel-del-monte","Castel del Monte","monuments",41.085,16.271),
W("assisi","Basilica di San Francesco ad Assisi","monuments",43.075,12.605),W("san-nicola","Basilica di San Nicola a Bari","monuments",41.131,16.870),W("santa-croce","Basilica di Santa Croce a Lecce","monuments",40.353,18.175),
W("palazzo-ducale-urbino","Palazzo Ducale di Urbino","monuments",43.725,12.637),W("san-vitale","Basilica di San Vitale a Ravenna","monuments",44.421,12.196),W("campo-siena","Piazza del Campo a Siena","monuments",43.318,11.332),
W("cinque-terre","Cinque Terre","places",44.130,9.700),W("portofino","Portofino","places",44.303,9.209),W("venezia","Venezia","places",45.440,12.315),
W("san-gimignano","San Gimignano","places",43.468,11.043),W("civita","Civita di Bagnoregio","places",42.627,12.113),W("sassi-matera","Sassi di Matera","places",40.667,16.610),
W("alberobello","Trulli di Alberobello","places",40.785,17.237),W("positano","Positano","places",40.628,14.485),W("amalfi","Amalfi","places",40.634,14.603),
W("taormina","Taormina","places",37.852,15.288),W("erice","Erice","places",38.039,12.587),W("orvieto","Orvieto","places",42.718,12.110),W("burano","Burano","places",45.485,12.417),
W("pompei","Pompei","archaeology",40.750,14.486),W("ercolano","Ercolano","archaeology",40.806,14.347),W("valle-templi","Valle dei Templi","archaeology",37.291,13.585),
W("teatro-taormina","Teatro Greco di Taormina","archaeology",37.852,15.292),W("su-nuraxi","Nuraghe Su Nuraxi","archaeology",39.706,8.991),W("paestum","Templi di Paestum","archaeology",40.423,15.005),
W("ostia-antica","Ostia Antica","archaeology",41.755,12.289),W("villa-adriana","Villa Adriana","archaeology",41.943,12.775),W("cerveteri","Necropoli di Cerveteri","archaeology",42.006,12.101),
W("selinunte","Selinunte","archaeology",37.584,12.824),W("neapolis","Parco archeologico della Neapolis","archaeology",37.075,15.275),
W("tre-cime","Tre Cime di Lavaredo","nature",46.618,12.305),W("braies","Lago di Braies","nature",46.695,12.085),W("marmore","Cascata delle Marmore","nature",42.552,12.714),
W("gran-paradiso","Parco Nazionale Gran Paradiso","nature",45.536,7.267),W("frasassi","Grotte di Frasassi","nature",43.401,12.974),W("castellana","Grotte di Castellana","nature",40.876,17.165),
W("scala-turchi","Scala dei Turchi","nature",37.289,13.473),W("costa-smeralda","Costa Smeralda","nature",41.140,9.500),W("cala-goloritze","Cala Goloritzé","nature",40.108,9.688),
W("stromboli","Stromboli","nature",38.789,15.213),W("etna","Etna","nature",37.751,14.993),W("vesuvio","Vesuvio","nature",40.822,14.428)
];

const CATEGORY_LABELS={regions:"REGIONI",capitals:"CAPOLUOGHI DI REGIONE",provinces:"CAPOLUOGHI DI PROVINCIA",physical:"ITALIA FISICA",wonders:"MERAVIGLIE D'ITALIA"};
const SUB_LABELS={seas:"MARI",lakes:"LAGHI",rivers:"FIUMI",mountains:"MONTI",volcanoes:"VULCANI",islands:"ISOLE",coasts:"STRETTI, GOLFI E PROMONTORI",monuments:"MONUMENTI",places:"CITTÀ D'ARTE E LUOGHI CELEBRI",archaeology:"ARCHEOLOGIA",nature:"NATURA"};

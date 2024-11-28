const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

// URL detection regex pattern
const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.(com|net|org|edu|gov|mil|biz|info|io|uk|de|ru|co|us|me|app))/gi;

// Address detection patterns
const addressPattern = /\b(?:\d{1,5}(?:[A-Z])?(?:[\s,.-]+(?:[A-Za-z0-9]+[\s,.-]+)*)?(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|way|place|pl|court|ct|circle|cir|highway|hwy|route|rt|terrace|ter|parkway|pkwy|plaza|plz|square|sq|alley|aly|close|grove|heights|hts|junction|jct|walk|row|crescent|cres|north|south|east|west|n|s|e|w)\b)|(?:apt|apartment|suite|unit|room|rm|floor|fl|building|bldg|house)\.?\s*#?\s*[a-z0-9-]+/gi;

// PO Box variations pattern
const poBoxPattern = /\b(?:p\.?\s*o\.?\s*box|post\s*office\s*box|postal\s*box|p\.?\s*o\.?\s*b\.?|p\.?\s*b\.?)\s*#?\s*\d+/gi;

// Building/Unit/Apartment pattern
const buildingPattern = /\b(?:apt|apartment|suite|unit|room|rm|floor|fl|building|bldg)\.?\s*#?\s*[a-z0-9-]+\b/gi;

// House number pattern (to catch standalone house numbers)
const houseNumberPattern = /\b\d{1,5}(?:-[A-Z0-9]+)?\s+[A-Za-z\s]+/gi;

// Direction prefixes/suffixes
const directionPattern = /\b(?:north|south|east|west|n|s|e|w)\s+(?:[A-Za-z]+\s+)?(?:street|st|road|rd|avenue|ave|boulevard|blvd)\b/gi;

// International postcode patterns
const postcodePatterns = [
    // UK: SW1A 1AA or SW1A1AA
    /\b[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}\b/gi,
    
    // USA: 12345 or 12345-6789
    /\b\d{5}(?:-\d{4})?\b/g,
    
    // Canada: A1A 1A1
    /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi,
    
    // Australia: 1234
    /\b[0-9]{4}\b/g,
    
    // Germany: 12345
    /\b[0-9]{5}\b/g,
    
    // France: 12345
    /\b[0-9]{5}\b/g,
    
    // Japan: 123-4567
    /\b[0-9]{3}-[0-9]{4}\b/g,
    
    // China: 123456
    /\b[0-9]{6}\b/g,
    
    // India: 123456 or 123 456
    /\b[0-9]{3}\s?[0-9]{3}\b/g,
    
    // Brazil: 12345-678
    /\b[0-9]{5}-[0-9]{3}\b/g,
    
    // Russia: 123456
    /\b[0-9]{6}\b/g,
    
    // Italy: 12345
    /\b[0-9]{5}\b/g,
    
    // Spain: 12345
    /\b[0-9]{5}\b/g,
    
    // Netherlands: 1234 AB
    /\b[1-9][0-9]{3}\s?[A-Z]{2}\b/gi,
    
    // Sweden: 123 45
    /\b[0-9]{3}\s?[0-9]{2}\b/g,
    
    // South Korea: 12345
    /\b[0-9]{5}\b/g,
    
    // Poland: 12-345
    /\b[0-9]{2}-[0-9]{3}\b/g
];

const addressPatterns = [
    addressPattern,
    poBoxPattern,
    buildingPattern,
    houseNumberPattern,
    directionPattern,
    ...postcodePatterns
];

const profanityBase = {
    'fuck': 'jiggle',
    'shit': 'sugar',
    'bitch': 'puppy',
    'cunt': 'peach',
    'ass': 'bum',
    'dick': 'banana'
};

// Word replacement mapping
const wordFilters = {
    ...profanityBase,
    // Profanity replacements
    'fuck': 'jiggle',
    'fucking': 'jigglin',
    'fuckin': 'jigglin',
    'fucker': 'jiggler',
    'fck': 'jig',
    'fuk': 'jig',
    'shit': 'sugar',
    'shitting': 'sugaring',
    'shitty': 'sweet',
    'ass': 'bum',
    'asshole': 'sweetheart',
    'bastard': 'muffin',
    'bitch': 'puppy',
    'bitching': 'barking',
    'cunt': 'peach',
    'dick': 'banana',
    'cock': 'rooster',
    'pussy': 'kitten',
    'piss': 'juice',
    'pissed': 'juiced',
    'damn': 'dang',
    'goddamn': 'goodness',
    'hell': 'heck',
    'wtf': 'wow',
    'stfu': 'shush',
    'poo': 'poopernickle',
    'poop': 'poopernickle',
    'crap': 'candy',
    'fat': 'podgy',
    'retard': 'legend',
    'whore': 'friend',
    'slut': 'friend',
    'hoe': 'friend',
    'wanker': 'silly',
    'bollocks': 'nonsense',
    'bugger': 'bother',
    'twat': 'sweet',
    'tits': 'chest',
    'boobs': 'chest',
    'fanny': 'bottom',
    'arse': 'bottom',
    'bloody': 'very',
    'wank': 'silly',
    'prick': 'pickle',
    'slag': 'friend',
    'tosser': 'silly',
    'git': 'silly',
    'sod': 'silly',
    'bs': 'nonsense',
    'bullshit': 'nonsense',
    'balls': 'balloons',
    'fart': 'toot',
    'jackass': 'donkey',
    'moron': 'genius',
    'screw': 'twist',
    'suck': 'rock',
    'sucks': 'rocks',
     // Profanity replacements
     'fuck': 'jiggle',
     'fucking': 'jigglin',
     'fuckin': 'jigglin',
     'fucker': 'jiggler',
     'fck': 'jig',
     'fuk': 'jig',
     'motherfucker': 'jigglemaster',
     'motherfucking': 'superjiggling',
     'motherfuckin': 'superjiggling',
     'fuckface': 'jigglepie',
     'fucktard': 'jigglebuddy',
     'fuckwit': 'jigglehead',
     'shit': 'sugar',
     'shitting': 'sugaring',
     'shitty': 'sweet',
     'shithead': 'sweetie',
     'shitface': 'sugarplum',
     'bullshit': 'nonsense',
     'bullshitter': 'storyteller',
     'ass': 'bum',
     'asshole': 'sweetheart',
     'asswipe': 'sweetpea',
     'assface': 'buttercup',
     'bastard': 'muffin',
     'bitch': 'puppy',
     'bitching': 'barking',
     'bitchy': 'playful',
     'son of a bitch': 'son of a puppy',
     'cunt': 'peach',
     'cunting': 'peachy',
     'dick': 'banana',
     'dickhead': 'fruitcake',
     'dickface': 'sweetface',
     'cock': 'rooster',
     'cocksucker': 'lollipop',
     'pussy': 'kitten',
     'piss': 'juice',
     'pissed': 'juiced',
     'pissing': 'juicing',
     'damn': 'dang',
     'goddamn': 'goodness',
     'damnit': 'dangit',
     'hell': 'heck',
     'wtf': 'wow',
     'stfu': 'shush',
     'poo': 'poopernickle',
     'poop': 'poopernickle',
     'poopy': 'poopernickly',
     'crap': 'candy',
     'crappy': 'sweet',
     'fat': 'podgy',
     'fatty': 'podgy',
     'fatso': 'podgy',
     'retard': 'legend',
     'retarded': 'legendary',
     'whore': 'friend',
     'slut': 'friend',
     'slutty': 'friendly',
     'hoe': 'friend',
     'wanker': 'silly',
     'wanking': 'playing',
     'bollocks': 'nonsense',
     'bugger': 'bother',
     'twat': 'sweet',
     'tits': 'chest',
     'titties': 'chest',
     'boobs': 'chest',
     'boobies': 'chest',
     'fanny': 'bottom',
     'arse': 'bottom',
     'arsehole': 'sweetheart',
     'bloody': 'very',
     'wank': 'silly',
     'wanking': 'playing',
     'prick': 'pickle',
     'slag': 'friend',
     'tosser': 'silly',
     'git': 'silly',
     'sod': 'silly',
     'sodding': 'silly',
     'bs': 'nonsense',
     'balls': 'balloons',
     'ballsack': 'balloon',
     'fart': 'toot',
     'farting': 'tooting',
     'jackass': 'donkey',
     'moron': 'genius',
     'moronic': 'brilliant',
     'screw': 'twist',
     'screwing': 'twisting',
     'suck': 'rock',
     'sucks': 'rocks',
     'sucking': 'rocking',
     'heck': 'gosh',
     'jesus': 'jeepers',
     'christ': 'crackers',
     'omg': 'oh my',
     'lmao': 'haha',
     'lmfao': 'hahaha',
     'af': 'very',
     'ffs': 'oh dear',
     'gtfo': 'leave',
     'stfd': 'sit',
     'pos': 'silly',
     'sob': 'sweetie',
     'thot': 'friend',
     'thotty': 'friendly',
     'heck': 'gosh',
     'idgaf': 'i care not',
     'tf': 'what',
     'fml': 'oh dear',
     'kys': 'be happy',
     'milf': 'parent',
     'dilf': 'parent',
     'pawg': 'person',
     'bbc': 'person',
     'nsfw': 'spicy',
     'xxx': 'hugs',
     'porn': 'art',
     'sexy': 'nice',
     'horny': 'excited',
     'kinky': 'fun',
     'thicc': 'lovely',
     'phat': 'nice',
      // Common abbreviations and variations
    'f u': 'j i',
    'f u c k': 'j i g g l e',
    'f*ck': 'jiggle',
    'f**k': 'jiggle',
    'f*****g': 'jigglin',
    'f***': 'jig',
    'fu': 'ji',
    'fuk u': 'hug u',
    'fk': 'jig',
    'fukn': 'jiggln',
    'fkn': 'jig',
    'af': 'very',
    'asf': 'very',
    'wtaf': 'what',
    'wth': 'what',
    'sthu': 'shush',
    'stfu': 'shush',
    'fu2': 'hi2',
    'fuu': 'hii',
    'fuuu': 'hiii',
    'fck u': 'hug u',
    'f off': 'skip off',
    'eff off': 'skip off',
    'effing': 'jigglin',
    'effin': 'jigglin',
    'sh*t': 'sugar',
    'sh1t': 'sugar',
    's h i t': 's u g a r',
    'b!tch': 'puppy',
    'b*tch': 'puppy',
    'b1tch': 'puppy',
    'b!ch': 'pup',
    'b*ch': 'pup',
    'b***h': 'puppy',
    'b s': 'oh my',
    'bs': 'oh my',
    'omfg': 'omg',
    'tf': 'what',
    'tfw': 'when',
    'tfw': 'when',
    'mf': 'my friend',
    'mfer': 'friend',
    'mofo': 'friend',
    'm8': 'mate',
    'gr8': 'great',
    'l8r': 'later',
    'h8': 'love',
    'h8r': 'lover',
    'pos': 'sweetie',
    'sob': 'dear',
    'smh': 'oh my',
    'fml': 'fun',
    'tbh': 'truly',
    'ngl': 'truly',
    'idc': 'okay',
    'idgaf': 'i care',
    'idec': 'i care',
    'dgaf': 'care',
    'kma': 'bye',
    'kys': 'smile',
    'ys': 'yes',
    'kms': 'smile',
    'imo': 'think',
    'imho': 'think',
    'stg': 'really',
    'fr fr': 'really',
    'frfr': 'really',
    'bruh': 'friend',
    'bruv': 'friend',
    'brah': 'friend',
    'ffs': 'oh my',
    'jfc': 'jeepers',
    'lfmao': 'haha',
    'lmaoo': 'haha',
    'lmfaoo': 'hahaha',
    'lololol': 'hahaha',
    'rofl': 'haha',
    'roflmao': 'hahaha',
    'ded': 'wow',
    'kek': 'haha',
    'kekw': 'haha',
    'sus': 'odd',
    'thot': 'friend',
    'thicc': 'nice',
    'thiccc': 'nice',
    'qt': 'cutie',
    'ily2': 'love you too',
    'ily': 'love you',
    'ik': 'i know',
    'idk': 'unsure',
    'idfk': 'unsure',
    'idek': 'unsure',
    'ikr': 'right',
    'ikyk': 'you know',
    'iykyk': 'you know',
    'iirc': 'recall',
    'istg': 'promise',
    'tysm': 'thanks',
    'tyvm': 'thanks',
    'ty': 'thanks',
    'np': 'welcome',
    'nvm': 'nevermind',
    'nrn': 'not now',
    'ofc': 'course',
    'obv': 'obvious',
    'pls': 'please',
    'plz': 'please',
    'rn': 'now',
    'tbf': 'fair',
    'tho': 'though',
    'u': 'you',
    'ur': 'your',
    'y': 'why',
    'ya': 'yes',
    'yh': 'yes',
    'yeet': 'wow',
    'yeeet': 'woww',
    'yolo': 'live',
    'yw': 'welcome',
    'ez': 'easy',
    'gg': 'good',
    'gj': 'good',
    'wp': 'well played',
    'ff': 'forfeit',
    'shitting': 'sugaring',
    'shitty': 'sweet',
    'asshole': 'sweetheart',
    'bitching': 'barking',
    'bitchy': 'playful'
};



const commonNames = [
    // English/American names
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian',
    'Ronald', 'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey',
    'Frank', 'Scott', 'Eric', 'Stephen', 'Andrew', 'Raymond', 'Gregory', 'Joshua', 'Jerry', 'Dennis',
    'Walter', 'Patrick', 'Peter', 'Harold', 'Douglas', 'Henry', 'Carl', 'Arthur', 'Ryan', 'Roger',
    
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Margaret', 'Lisa', 'Nancy', 'Betty', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna',
    'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon', 'Cynthia',
    'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Ruth', 'Brenda', 'Pamela', 'Nicole', 'Katherine',
    'Samantha', 'Christine', 'Catherine', 'Virginia', 'Debra', 'Rachel', 'Janet', 'Emma', 'Carolyn', 'Maria',
    
    // Spanish/Latino names
    'Carlos', 'Juan', 'Luis', 'Miguel', 'Jose', 'Francisco', 'Pedro', 'Antonio', 'Manuel', 'Ricardo',
    'Diego', 'Ramon', 'Rafael', 'Alejandro', 'Fernando', 'Roberto', 'Eduardo', 'Javier', 'Sergio', 'Jorge',
    'Maria', 'Ana', 'Sofia', 'Isabella', 'Carmen', 'Rosa', 'Angela', 'Elena', 'Lucia', 'Adriana',
    'Gabriela', 'Victoria', 'Camila', 'Valentina', 'Daniela', 'Mariana', 'Catalina', 'Paula', 'Andrea', 'Diana',
    
    // Chinese names
    'Wei', 'Li', 'Ming', 'Hui', 'Yan', 'Ling', 'Xiao', 'Hong', 'Yu', 'Jing',
    'Chen', 'Zhang', 'Wang', 'Liu', 'Yang', 'Huang', 'Wu', 'Zhou', 'Zhao', 'Sun',
    'Feng', 'Lin', 'Cheng', 'Yong', 'Jun', 'Xiang', 'Bin', 'Qiang', 'Lei', 'Tao',
    
    // Indian names
    'Raj', 'Amit', 'Arun', 'Rahul', 'Priya', 'Neha', 'Anjali', 'Pooja', 'Ravi', 'Ajay',
    'Vijay', 'Sanjay', 'Rajesh', 'Sunil', 'Anil', 'Rakesh', 'Deepak', 'Rajiv', 'Ashok', 'Ramesh',
    'Sunita', 'Anita', 'Deepa', 'Meera', 'Kavita', 'Shobha', 'Asha', 'Usha', 'Nisha', 'Geeta',
    
    // Arabic names
    'Mohammed', 'Ahmad', 'Ali', 'Hassan', 'Hussein', 'Omar', 'Ibrahim', 'Yusuf', 'Mustafa', 'Abdul',
    'Fatima', 'Aisha', 'Zainab', 'Mariam', 'Noor', 'Layla', 'Amira', 'Rania', 'Huda', 'Samar',
    
    // African names
    'Kwame', 'Kofi', 'Kwesi', 'Kojo', 'Kwaku', 'Yaw', 'Abena', 'Efua', 'Ama', 'Adwoa',
    'Chidi', 'Olayinka', 'Folami', 'Babajide', 'Oluwaseun', 'Chibueze', 'Olayinka', 'Afolabi', 'Babatunde', 'Oluwaseun',
    
    // Japanese names
    'Hiroshi', 'Takashi', 'Kenji', 'Yuki', 'Akiko', 'Yoko', 'Kazuo', 'Satoshi', 'Kaori', 'Yumi',
    'Taro', 'Jiro', 'Shiro', 'Ichiro', 'Hana', 'Yui', 'Aoi', 'Rin', 'Mei', 'Saki',
    
    // Korean names
    'Min', 'Jin', 'Soo', 'Jung', 'Hye', 'Sung', 'Young', 'Jae', 'Hyun', 'Seung',
    'Ji-hoon', 'Min-jun', 'Seo-yeon', 'Ji-min', 'Min-soo', 'Hye-jin', 'Soo-jin', 'Ji-young', 'Min-ho', 'Seung-hun',
    
    // Russian names
    'Ivan', 'Dmitri', 'Vladimir', 'Boris', 'Sergei', 'Andrei', 'Mikhail', 'Nikolai', 'Pavel', 'Alexander',
    'Natasha', 'Olga', 'Tatiana', 'Elena', 'Svetlana', 'Marina', 'Irina', 'Anna', 'Ekaterina', 'Yulia',
    
    // French names
    'Jean', 'Pierre', 'Michel', 'Philippe', 'François', 'Henri', 'Louis', 'Antoine', 'Nicolas', 'Claude',
    'Marie', 'Sophie', 'Catherine', 'Isabelle', 'Anne', 'Claire', 'Julie', 'Caroline', 'Céline', 'Nathalie',
    
    // German names
    'Hans', 'Peter', 'Michael', 'Wolfgang', 'Klaus', 'Jürgen', 'Dieter', 'Manfred', 'Helmut', 'Günter',
    'Ursula', 'Ingrid', 'Helga', 'Renate', 'Monika', 'Karin', 'Brigitte', 'Sabine', 'Andrea', 'Petra'
].map(name => name.toLowerCase());
// Fantasy names list
const fantasyNames = [
    'Starlight', 'Rainbow', 'Moonbeam', 'Sunshine', 'Cloudwhisper', 'Dewdrop', 'Riverflow', 'Skywalker',
    'Stormrider', 'Dreamweaver', 'Firefly', 'Windrunner', 'Sunflower', 'Moonshadow', 'Stardust',
    // Add the rest of your fantasy names here...
];

// Function to escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Modified word pattern to better handle word boundaries and variations
const wordPattern = new RegExp('\\b(' + 
    Object.keys(wordFilters)
        .map(word => escapeRegExp(word))
        .join('|') + 
    ')\\b', 'gi');

// Modified name pattern with escaped special characters
const namePattern = new RegExp('\\b(' + 
    commonNames
        .map(name => escapeRegExp(name))
        .join('|') + 
    ')\\b', 'gi');

// Enhanced word replacement function
function replaceInappropriateWords(text) {
    return text.replace(wordPattern, (matched) => {
        const replacement = wordFilters[matched.toLowerCase()];
        return matched[0] === matched[0].toUpperCase() 
            ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
            : replacement;
    });
}

// Function to check if text contains profanity
function containsProfanity(text) {
    // Normalize text: remove extra spaces, convert to lowercase
    text = text.toLowerCase().replace(/\s+/g, ' ');
    
    // Check direct matches first (faster)
    if (Object.keys(wordFilters).some(word => text.includes(word.toLowerCase()))) {
        return true;
    }
    
    // Check for obfuscated profanity using the word pattern
    return wordPattern.test(text);
}
// Function to get random fantasy name
function getRandomFantasyName() {
    return fantasyNames[Math.floor(Math.random() * fantasyNames.length)];
}

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});// Socket connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        console.log('Received message:', msg.text);
        let processedMessage = msg.text;

        // Check for URLs in the message
        if (urlPattern.test(processedMessage)) {
            console.log('Blocked message containing URL');
            socket.emit('message blocked', { error: 'URLs are not allowed in messages' });
            return;
        }

        // Check for addresses and postcodes
        const hasAddress = addressPattern.test(processedMessage) || 
                          poBoxPattern.test(processedMessage) || 
                          buildingPattern.test(processedMessage) ||
                          houseNumberPattern.test(processedMessage) ||
                          directionPattern.test(processedMessage);
        const hasPostcode = postcodePatterns.some(pattern => pattern.test(processedMessage));

        if (hasAddress || hasPostcode) {
            console.log('Blocked message containing address or postcode');
            socket.emit('message blocked', { error: 'Physical addresses and postcodes are not allowed in messages' });
            return;
        }

        // Check for profanity
        if (containsProfanity(processedMessage)) {
            processedMessage = replaceInappropriateWords(processedMessage);
            console.log('Profanity detected and replaced');
        }
        
        // Process names
        processedMessage = processedMessage.replace(namePattern, (match) => {
            console.log('Replacing name:', match);
            return getRandomFantasyName();
        });
        
        // Process addresses (catch any that slipped through)
        addressPatterns.forEach(pattern => {
            processedMessage = processedMessage.replace(pattern, '[address removed for privacy]');
        });
        
        // Broadcast the processed message
        io.emit('chat message', { text: processedMessage });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
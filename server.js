const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

// URL detection regex pattern
const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.(com|net|org|edu|gov|mil|biz|info|io|uk|de|ru|co|us|me|app))/gi;

// Address detection patterns
const addressPattern = /\b\d+\s+([A-Za-z]+(?: [A-Za-z]+)*)\s+(St(?:reet)?|Rd|Road|Ave(?:nue)?|Blvd|Boulevard|Ln|Lane|Dr(?:ive)?|Way|Place|Pl|Court|Ct|Circle|Cir|Highway|Hwy|Route|Rt)\b/gi;
const poBoxPattern = /\b[P|p](?:ost)?\.?\s*[O|o](?:ffice)?\.?\s*[B|b](?:ox)?\s+\d+\b/g;

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

// Word replacement mapping
const wordFilters = {
    'stupid': 'smart',
    'dumb': 'clever',
    'idiot': 'friend',
    'hate': 'love',
    'ugly': 'beautiful',
    'bad': 'good',
    'terrible': 'wonderful',
    'horrible': 'amazing',
    'shut up': 'please continue',
    'die': 'live',
    'kill': 'hug'
};

// Common names to detect and replace (hundreds of common names from various cultures)
const commonNames = [
    // English names
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian',
    'Margaret', 'Lisa', 'Nancy', 'Betty', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna',
    'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey', 'Frank',
    'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon', 'Cynthia',
    'Scott', 'Eric', 'Stephen', 'Andrew', 'Raymond', 'Gregory', 'Joshua', 'Jerry', 'Dennis', 'Walter',
    'Catherine', 'Christine', 'Samantha', 'Virginia', 'Rachel', 'Hannah', 'Nicole', 'Amy', 'Helen', 'Anna',
    // Spanish names
    'Carlos', 'Juan', 'Luis', 'Miguel', 'Jose', 'Francisco', 'Pedro', 'Antonio', 'Manuel', 'Ricardo',
    'Maria', 'Ana', 'Sofia', 'Isabella', 'Carmen', 'Rosa', 'Angela', 'Elena', 'Lucia', 'Adriana',
    // Chinese names
    'Wei', 'Li', 'Ming', 'Hui', 'Yan', 'Ling', 'Xiao', 'Hong', 'Yu', 'Jing',
    // Indian names
    'Raj', 'Amit', 'Arun', 'Rahul', 'Priya', 'Neha', 'Anjali', 'Pooja', 'Ravi', 'Ajay',
    'Sunita', 'Anita', 'Deepa', 'Meera', 'Kavita', 'Sanjay', 'Vijay', 'Rajesh', 'Sunil', 'Anil',
    // Arabic names
    'Mohammed', 'Ahmad', 'Ali', 'Hassan', 'Hussein', 'Fatima', 'Aisha', 'Zainab', 'Omar', 'Ibrahim',
    // African names
    'Kwame', 'Kofi', 'Abena', 'Kwesi', 'Efua', 'Kojo', 'Kwaku', 'Ama', 'Yaw', 'Adwoa',
    // Japanese names
    'Hiroshi', 'Takashi', 'Kenji', 'Yuki', 'Akiko', 'Yoko', 'Kazuo', 'Satoshi', 'Kaori', 'Yumi',
    // Korean names
    'Min', 'Jin', 'Soo', 'Jung', 'Hye', 'Sung', 'Young', 'Jae', 'Hyun', 'Seung',
    // Russian names
    'Ivan', 'Dmitri', 'Vladimir', 'Boris', 'Natasha', 'Olga', 'Tatiana', 'Igor', 'Sergei', 'Anna'
].map(name => name.toLowerCase());

// Expanded fantasy names list
const fantasyNames = [
    // Nature-inspired
    'Starlight', 'Rainbow', 'Moonbeam', 'Sunshine', 'Cloudwhisper', 'Dewdrop', 'Riverflow', 'Skywalker',
    'Stormrider', 'Dreamweaver', 'Firefly', 'Windrunner', 'Sunflower', 'Moonshadow', 'Stardust',
    'Raindance', 'Twilight', 'Aurora', 'Phoenix', 'Crystal', 'Shadow', 'Echo', 'Nova', 'Cosmos',
    'Nebula', 'Galaxy', 'Comet', 'Luna', 'Sol', 'Zenith',
    // Mythological
    'Atlas', 'Artemis', 'Apollo', 'Athena', 'Hermes', 'Iris', 'Neptune', 'Orion', 'Perseus', 'Zeus',
    'Thor', 'Loki', 'Odin', 'Freya', 'Valkyrie', 'Dragon', 'Griffin', 'Phoenix', 'Pegasus', 'Sphinx',
    // Fantasy creatures
    'Pixie', 'Sprite', 'Fairy', 'Unicorn', 'Dragon', 'Mermaid', 'Wizard', 'Elf', 'Nymph', 'Sylph',
    // Elements
    'Ember', 'Frost', 'Breeze', 'Storm', 'Blaze', 'Mist', 'Thunder', 'Lightning', 'Glacier', 'Flame',
    // Gems and minerals
    'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Jade', 'Amber', 'Opal', 'Pearl', 'Topaz', 'Onyx',
    // Celestial
    'Astro', 'Cosmic', 'Star', 'Moon', 'Sun', 'Meteor', 'Pulsar', 'Quasar', 'Eclipse', 'Solstice',
    // Colors
    'Azure', 'Crimson', 'Violet', 'Indigo', 'Golden', 'Silver', 'Obsidian', 'Scarlet', 'Cerulean', 'Ivory',
    // Mystical concepts
    'Destiny', 'Fate', 'Fortune', 'Spirit', 'Soul', 'Mystic', 'Legend', 'Myth', 'Dream', 'Vision',
    // Nature elements
    'Ocean', 'Forest', 'Mountain', 'River', 'Valley', 'Garden', 'Meadow', 'Grove', 'Glen', 'Brook',
    // Time concepts
    'Dawn', 'Dusk', 'Midnight', 'Twilight', 'Evening', 'Morning', 'Sunset', 'Sunrise', 'Eclipse', 'Eternal',
    // Weather phenomena
    'Rainbow', 'Storm', 'Thunder', 'Lightning', 'Tornado', 'Hurricane', 'Blizzard', 'Tempest', 'Zephyr', 'Breeze'
];

// Create name pattern
const namePattern = new RegExp('\\b(' + commonNames.join('|') + ')\\b', 'gi');

// Function to get random fantasy name
function getRandomFantasyName() {
    return fantasyNames[Math.floor(Math.random() * fantasyNames.length)];
}

// Create regex pattern for all words to filter
const wordPattern = new RegExp('\\b(' + Object.keys(wordFilters).join('|') + ')\\b', 'gi');

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        // Check for URLs in the message
        if (urlPattern.test(msg.text)) {
            console.log('Blocked message containing URL');
            socket.emit('message blocked', { error: 'URLs are not allowed in messages' });
            return;
        }

        // Check for addresses and postcodes in the message
        const hasAddress = addressPattern.test(msg.text) || poBoxPattern.test(msg.text);
        const hasPostcode = postcodePatterns.some(pattern => pattern.test(msg.text));

        if (hasAddress || hasPostcode) {
            console.log('Blocked message containing address or postcode');
            socket.emit('message blocked', { error: 'Physical addresses and postcodes are not allowed in messages' });
            return;
        }

        // Replace real names with fantasy names
        let processedText = msg.text.replace(namePattern, () => getRandomFantasyName());

        // Filter out inappropriate words
        processedText = processedText.replace(wordPattern, matched => {
            // Preserve the original capitalization
            const replacement = wordFilters[matched.toLowerCase()];
            return matched[0] === matched[0].toUpperCase() 
                ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
                : replacement;
        });
        
        // Update the message text with filtered version
        msg.text = processedText;
        
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
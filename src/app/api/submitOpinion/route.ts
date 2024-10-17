import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Ensure the /tmp/opinions directory exists
const ensureDirectoryExists = async (dirPath: string) => {
    const fs = await import('fs');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Function to get the next available image filename
const getNextImageFilename = async (dirPath: string): Promise<string> => {
    const fs = await import('fs');
    const files = fs.readdirSync(dirPath);
    let maxNumber = 0;
    const regex = /img-(\d+)\.png/;
    for (const file of files) {
        const match = regex.exec(file);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) {
                maxNumber = num;
            }
        }
    }
    const nextNumber = maxNumber + 1;
    const filename = `img-${String(nextNumber).padStart(3, '0')}.png`;
    return `${dirPath}/${filename}`;
};

async function POST(request: Request): Promise<Response> {
    console.log('API hit');
    try {
        // Dynamically import modules
        const puppeteer = await import('puppeteer');

        const body = await request.json();
        const { opinion, gradeLevel, name, clientData } = body;

        // Extract the IP address from the request headers (if available)
        const ipAddress =
            request.headers.get('x-forwarded-for') ||
            request.headers.get('remote-addr') ||
            '127.0.0.1';
        const device = `${convertUserAgent(clientData?.platform) || 'Unknown Platform'}`;

        // Get location from IP address using an external API
        const location = await getLocationFromIP(ipAddress);

        // Generate a hash-based pixel background pattern
        const backgroundPattern = generateAdvancedArtisticBackgroundPattern(opinion);

        // Create a formatted HTML block with the user data
        const formattedData = `
            <div class="w-full h-full flex items-center justify-center" style="background-image: url('data:image/svg+xml,${backgroundPattern}'); background-size: cover; background-repeat: no-repeat;">
              <div class="w-11/12 md:w-8/12 lg:w-6/12 p-8 flex flex-col bg-white bg-opacity-90 rounded-2xl shadow-2xl" style="backdrop-filter: blur(10px);">
                <!-- Fake Twitter Header -->
                <div class="flex items-center mb-4">
                  <img src="https://upload.wikimedia.org/wikipedia/sco/9/9f/Twitter_bird_logo_2012.svg" alt="Twitter Logo" class="w-8 h-8 m-3">
                  <div>
                    <div class="text-xl font-bold text-gray-900">${name}</div>
                    <div class="text-sm text-gray-500">@${name.toLowerCase().replace(/\s+/g, '')}</div>
                  </div>
                </div>
                <!-- Tweet Content -->
                <div class="text-lg text-gray-700 mb-4">${opinion}</div>
                <!-- Tweet Metadata -->
                <div class="text-sm text-gray-500 mb-6">${gradeLevel} student | Sent from ${device} ${location}</div>
                <!-- Fake Action Buttons -->
                <div class="flex justify-between items-center text-gray-500">
                  <div class="flex items-center space-x-2">
                    <button class="flex items-center space-x-1">
                      <span class="material-symbols-outlined">favorite</span>
                      <span>0</span>
                    </button>
                    <button class="flex items-center space-x-1">
                      <span class="material-symbols-outlined">share_windows</span>
                      <span>5</span>
                    </button>
                    <button class="flex items-center space-x-1">
                      <span class="material-symbols-outlined">comment</span>
                      <span>1</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        `;

        // Ensure the /tmp/opinions directory exists
        const dirPath = '/tmp/opinions';
        await ensureDirectoryExists(dirPath);

        // Get the next available image filename
        const imagePath = await getNextImageFilename(dirPath);

        // Generate image from HTML and save to file
        await generateImageFromHTML(formattedData, puppeteer, imagePath);

        // Return a success response
        return NextResponse.json({ message: 'Data received successfully' });
    } catch (error) {
        console.error('Error in POST handler:', error);
        return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
    }
}

async function getLocationFromIP(ipAddress: string): Promise<string> {
    try {
        const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
        const data = await response.json();
        if (data && data.city && data.country) {
            const location = `${data.city}, ${data.country}`;
            return checkPlanetLocation(location); // Check if it's Mars or Venus
        } else {
            console.error(data)
            return checkPlanetLocation('Earth'); // Default to earth
        }
    } catch (error) {
        console.error('IP geolocation failed:', error);
        return checkPlanetLocation('Mars'); // Default to mars on error
    }
}

function checkPlanetLocation(location: string): string {
    const planetsWithOn = ['Mars', 'Earth'];
    for (const planet of planetsWithOn) {
        if (location.includes(planet)) {
            return `on ${location}`; // Use "on" for Mars and Venus
        }
    }
    return `in ${location}`; // Default to "in" for all other locations
}

function generateAdvancedArtisticBackgroundPattern(opinion: string): string {
    // Generate multiple hash digests by applying transformations to the opinion string
    const hashes: string[] = [];
    const transformations = [
        (s: string) => s, // Original
        (s: string) => s.split('').reverse().join(''), // Reversed
        (s: string) => s.toUpperCase(), // Uppercase
        (s: string) => s.toLowerCase(), // Lowercase
        (s: string) => s.split('').sort().join(''), // Sorted characters
    ];

    transformations.forEach((transform) => {
        const transformedOpinion = transform(opinion);
        const hash = crypto.createHash('md5').update(transformedOpinion).digest('hex');
        hashes.push(hash);
    });

    // Concatenate all hashes to increase entropy
    const combinedHash = hashes.join('');

    // Use the combined hash to generate a gradient background with particle effects
    let pattern = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">';

    // Generate gradient transition with two colors and direction based on hash
    const startHashIndex = 0;
    const endHashIndex = 1;
    const startHue = (parseInt(combinedHash[startHashIndex], 16) * 22.5) % 360;
    const endHue = (parseInt(combinedHash[endHashIndex], 16) * 22.5) % 360;
    const gradientAngle = (parseInt(combinedHash[2], 16) * 10) % 360;
    pattern += `<defs><linearGradient id="grad1" gradientTransform="rotate(${gradientAngle})">
        <stop offset="0%" style="stop-color:hsl(${startHue}, 70%, 50%);stop-opacity:1" />
        <stop offset="100%" style="stop-color:hsl(${endHue}, 70%, 50%);stop-opacity:1" />
    </linearGradient></defs>`;

    // Add background rectangle with gradient fill
    pattern += '<rect width="1200" height="1200" fill="url(#grad1)" />';

    // Generate particle systems
    const numParticles = 200;
    for (let i = 0; i < numParticles; i++) {
        const entropy = parseInt(combinedHash.slice((i * 6) % combinedHash.length, (i * 6 + 6) % combinedHash.length), 16);
        const x = entropy % 1200;
        const y = (entropy >> 12) % 1200;
        const mean = 8;
        const stddev = 2;
        const u1 = (parseInt(combinedHash.slice(i * 2, i * 2 + 2), 16) / 255) || 0.5;
        const u2 = (parseInt(combinedHash.slice(i * 2 + 2, i * 2 + 4), 16) / 255) || 0.5;
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const size = Math.abs(mean + z0 * stddev);
        const opacity = ((entropy >> 28) % 30) / 100 + 0.3;
        const hue = (parseInt(combinedHash[(i * 3) % combinedHash.length], 16) * 22.5) % 360;
        const color = `hsl(${hue}, 80%, 90%)`;
        if (size > 1) {
            pattern += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" fill-opacity="${opacity}" />`;
        }
    }

    pattern += '</svg>';

    // Encode the SVG to be used as a data URL
    return encodeURIComponent(pattern);
}

// Function to generate the image using Puppeteer
async function generateImageFromHTML(html: string, puppeteer: any, filePath: string): Promise<void> {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });
    const page = await browser.newPage();

    // Set the HTML content with styles
    await page.setContent(`
    <html>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400&icon=favorite" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400&icon=share_windows" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400&icon=comment" />
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

    // Set the viewport for a 1:1 image
    await page.setViewport({
        width: 800,
        height: 800,
        deviceScaleFactor: 2,
    });

    // Take a screenshot and save it to the specified file path
    await page.screenshot({ path: filePath, type: 'png' });
    await browser.close();
}

const userAgentMap = {
    "MacIntel": "Mac",
    "MacPPC": "Mac",
    "Win32": "Windows",
    "Win64": "Windows",
    "Windows NT 10.0": "Windows 10",
    "Windows NT 6.1": "Windows 7",
    "Windows NT 6.2": "Windows 8",
    "Windows NT 6.3": "Windows 8.1",
    "Windows NT 5.1": "Windows XP",
    "X11; Linux x86_64": "Linux",
    "X11; Linux i686": "Linux",
    "iPhone": "iPhone",
    "iPad": "iPad",
    "Android": "Android",
    "CrOS": "Chrome OS",
    "Opera": "Opera",
    "OPR": "Opera",
    "Edg": "Edge",
    "MSIE": "Internet Explorer",
    "Trident": "Internet Explorer",
    "Safari": "Safari",
    "Firefox": "Firefox",
    "Chrome": "Chrome",
    "Ubuntu": "Ubuntu",
    "Debian": "Debian",
    "Fedora": "Fedora",
    "Slackware": "Slackware",
    "CentOS": "CentOS",
    "Arch": "Arch Linux",
    "FreeBSD": "FreeBSD",
    "NetBSD": "NetBSD",
    "OpenBSD": "OpenBSD",
    "SunOS": "Solaris",
    "Haiku": "Haiku OS",
    "Nintendo Switch": "Nintendo Switch",
    "PlayStation 4": "PlayStation 4",
    "PlayStation 5": "PlayStation 5",
    "Xbox One": "Xbox One",
    "Xbox Series X": "Xbox Series X",
    "Roku": "Roku",
    "Tizen": "Tizen",
    "webOS": "webOS",
    "BlackBerry": "BlackBerry",
    "Symbian": "Symbian",
    "MeeGo": "MeeGo",
    "Windows Phone": "Windows Phone",
    "Nokia": "Nokia",
    "Kindle": "Kindle",
    "Oculus": "Oculus",
    "Vivaldi": "Vivaldi",
    "YaBrowser": "Yandex Browser"
};

// Function to convert cryptic user agent to human-readable
function convertUserAgent(userAgent: string) {
    for (const [key, value] of Object.entries(userAgentMap)) {
        if (userAgent.includes(key)) {
            return value;
        }
    }
    return "Unknown Platform";
}

export { POST };
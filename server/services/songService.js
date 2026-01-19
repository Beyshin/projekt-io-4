const songs = [
    { title: "Bohemian Rhapsody", artist:"Queen", clue: "Mama, just killed a man...",  country: "US"},
    { title: "Shape of You", artist:"Ed Sheeran", clue: "The club isn't the best place to find a lover...",  country: "US" },
    { title: "Billie Jean", artist:"Micheal Jackson", clue: "She was more like a beauty queen from a movie scene...",  country: "US" },
    { title: "Szklana Pogoda", artist: "Lombard", clue: "Szyby niebieskie od telewizorów...", country: "PL" },
    { title: "Parostatek", artist:"Krzysztof Krawczyk", clue: "Parostatkiem w piękny rejs...", country: "PL" },
    {title: "Fear of the Dark", artist: "Iron Maiden", clue: "I have a constant fear that something's always near..."},
    {title: 'Slow Burner', artist: "Interplanetary Criminal", clue: "Brak wskazówki"}
];

export function generateRandomSong() {
    return songs[Math.floor(Math.random() * songs.length)];
}

export async function getSongData(){
    const song = generateRandomSong();
    const BASE_URL = "https://itunes.apple.com/search?";

    const searchParams = new URLSearchParams({
        "term": `${song.title} ${song.artist}`,
        "country": song.country ? song.country : "US",
        "media": "music",
        "entity": "song"
    });

    const result = await fetch(`${BASE_URL}${searchParams}`,
        {
            method: "GET"
        })

    if(result.ok){
        const data = await result.json();
        const songUrl =  data.results[0].previewUrl;
        console.log("Pobrano piosenke w service: " + songUrl);
        return({
            title: song.title,
            artist: song.artist,
            clue: song.clue,
            songUrl: songUrl
        })
    }

    return null;
}


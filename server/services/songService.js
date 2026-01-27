import { title } from "process";

const songs = [
    { title: "Bohemian Rhapsody", artist:"Queen", clue: "Mama, just killed a man...",  country: "US"},
    { title: "Shape of You", artist:"Ed Sheeran", clue: "The club isn't the best place to find a lover...",  country: "US" },
    { title: "Billie Jean", artist:"Micheal Jackson", clue: "She was more like a beauty queen from a movie scene...",  country: "US" },
    { title: "Szklana Pogoda", artist: "Lombard", clue: "Szyby niebieskie od telewizorów...", country: "PL" },
    { title: "Parostatek", artist:"Krzysztof Krawczyk", clue: "Parostatkiem w piękny rejs...", country: "PL" },
    { title: "Fear of the Dark", artist: "Iron Maiden", clue: "I have a constant fear that something's always near..."},
    { title: 'Slow Burner', artist: "Interplanetary Criminal", clue: "Brak wskazówki"},
    { title: "Blinding Lights", artist:"The Weeknd", clue: "I said, ooh, I'm blinded by the lights...",  country: "US"},
    { title: "Levitating", artist:"Dua Lipa", clue: "You want me, I want you, baby...",  country: "US" },
    { title: "Rolling in the Deep", artist:"Adele", clue: "We could have had it all...",  country: "US" },
    { title: "Dancing Queen", artist: "ABBA", clue: "You can dance, you can jive...", country: "SE" },
    { title: "Hotel California", artist:"Eagles", clue: "You can check out any time you like, but you can never leave...", country: "US" },
    {title: "Take On Me", artist: "a-ha", clue: "Take on me, take me on..."},
    {title: "Bad Guy", artist: "Billie Eilish", clue: "So you're a tough guy..."},
    {title: "The Sound of Silence", artist: "Simon & Garfunkel", clue: "In the shadows of the night..."},
    {title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", clue: "Don't believe me just watch..."},
    {title: "Co mi panie dasz", artist:"Bajm", clue: "Kilka starych szmat..", country: "PL" },
    {title: "Jak gdyby nic", artist:"Kuban", clue: "Dolewam dolewam dolewam...", country: "PL" },

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

    const result = await fetch(`${BASE_URL}${searchParams}`, { method: "GET" });

    if(result.ok){
        const data = await result.json();
        let songUrl = "";
        let albumCover = "";
        let albumName = "";
        let releaseYear = "";
        let artistName = song.artist; // Domyślnie z naszej listy

        if(data.results.length > 0){
            const track = data.results[0];
            songUrl = track.previewUrl;
            albumCover = track.artworkUrl100.replace("100x100bb", "600x600bb");
            
            // Pobieramy dodatkowe dane z iTunes
            albumName = track.collectionName;
            artistName = track.artistName; // Lepsza nazwa artysty prosto z iTunes
            releaseYear = track.releaseDate ? track.releaseDate.substring(0, 4) : ""; // Wyciągamy tylko rok (np. 2023)
        }

        return({
            title: song.title,
            artist: artistName,
            album: albumName,
            year: releaseYear,
            clue: song.clue,
            songUrl: songUrl,
            albumCover: albumCover
        });
    }
    return null;
}
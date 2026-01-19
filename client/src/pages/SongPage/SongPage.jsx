import {useEffect, useRef, useState} from "react";
import {useSocket} from "../../context/SocketContext";
import BackArrow from "../../components/BackArrow/BackArrow";
import ChatComponent from "../../components/ChatComponent/ChatComponent";
import AnimatedComponent from "../../components/AnimatedComponent/AnimatedComponent";
import buttonSprite from '../../assets/png/send-button-sheet.png';
import {ReactComponent as CornerL} from "../../assets/svg/corner-left.svg";
import {ReactComponent as CornerR} from "../../assets/svg/corner-right.svg";
import {useParams} from "react-router-dom";
import styles from "./SongPage.module.css";

function GuessSongPage() {
    const {id} = useParams();
    const inputRef = useRef(null)
    const socket = useSocket();
    const [msg, setMsg] = useState("");
    const [messages, setMessages] = useState([]);

    const [gameActive, setGameActive] = useState(false);
    const [round, setRound] = useState(0);
    const [maxRounds, setMaxRounds] = useState(5);
    const [timeLeft, setTimeLeft] = useState(30);
    const [players, setPlayers] = useState([]);

    const [hintWord, setHintWord] = useState("");
    const [clueText, setClueText] = useState("");
    const [started, setStarted] = useState(false);

    const isOwner = players.find(p => p.id === socket?.id)?.isOwner || false;

    const audioRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.emit("sync-game", id);

        socket.on("echo", (data) => {
            setMessages((prev) => [...prev, {username: data["sender"], message: data["message"], type: "normal"}]);
        });
        socket.on("player-joined", (data) => {
            setMessages((prev) => [...prev, {username: data.nickname, type: "user-join"}]);
            socket.emit("sync-game", id);
        });
        socket.on("player-left", (data) => {
            setMessages((prev) => [...prev, {username: data.nickname, type: "user-left"}]);
        });

        socket.on("new-round", (data) => {
            setGameActive(true);
            setRound(data.round);
            setMaxRounds(data.maxRounds);

            if(audioRef.current) {
                audioRef.current.pause();
            }
            const songUrl = data.songUrl;
            console.log("songUrl", songUrl);
            const audio = new Audio(songUrl);
            audio.volume = 0.2;
            audio.play();
            audioRef.current = audio;


            setTimeLeft(data.timeLeft || 30);

            setHintWord(data.hint || "");
            setClueText(data.clue || "");

            setMessages((prev) => [...prev, {
                username: "SYSTEM",
                message: `Runda ${data.round} / ${data.maxRounds}! Zgadnij piosenkę!`,
                type: "system"
            }]);
        });

        socket.on("update-players", (playerList) => setPlayers(playerList));
        socket.on("timer-update", (data) => setTimeLeft(data.timeLeft));
        socket.on("time-up", (data) => {
            audioRef.current.pause();
            setMessages((prev) => [...prev, {username: "SYSTEM",message: data["message"], type: "system"}]);
        })
        socket.on("correct-answer", (data) => {
            setMessages((prev) => [...prev, {
                username: "SUKCES",
                message: `${data.winner} odgadł tytuł! (+${data.pointsAdded} pkt)`,
                type: "system"
            }]);
        });

        socket.on("game-over", (data) => {
            audioRef.current.pause();
            setGameActive(false);
            setMessages((prev) => [...prev, {username: "SYSTEM", message: data.message, type: "system"}]);
        });

        return () => {
            socket.off("new-round");
            socket.off("correct-answer");
            socket.off("timer-update");
            socket.off("game-over");
            socket.off("echo");
            socket.off("player-joined");
            socket.off("player-left");
            socket.off("update-players");
        }
    }, [socket, id]);

    const sendMessage = () => {
        if(!msg) return;
        socket.emit("message", { message: msg, roomId: id })
        setMsg("");
        inputRef.current.value = "";
    }

    const startGame = () => {
        setStarted(true);
        socket.emit("start-game", id);
    }

    const pauseSong = () => {
        audioRef.current.pause();
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.leftContainer}>
                <div className={styles.upLeftContainer}>
                    <BackArrow roomId={id} callback={started ? pauseSong : null}></BackArrow>
                    <div className={styles.scoreboardContainer}>
                        <h3 className={styles.scoreTitle}>Wyniki</h3>
                        <ul className={styles.playerList}>
                            {players.map((p) => (
                                <li key={p.id} className={styles.playerItem}>
                                    <span className={styles.playerName}>
                                        {p.isOwner && "👑"} {p.nickname}
                                    </span>
                                    <span className={styles.playerPoints}>{p.points}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className={styles.middleContainer}>
                {/* Info Bar */}
                <div className={styles.gameInfoBar}>
                    {!gameActive ? (
                        <div className={styles.lobbyInfo}>
                            <h2>Pokój: {id}</h2>
                            {isOwner ? (
                                <button className={styles.startBtn} onClick={startGame}>START</button>
                            ) : (
                                <span style={{color: '#aaa', fontStyle: 'italic'}}>Czekanie na właściciela...</span>
                            )}
                        </div>
                    ) : (
                        <div className={styles.activeGameInfo}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Runda</span>
                                <span className={styles.value}>{round}/{maxRounds}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Czas</span>
                                <span className={`${styles.timerValue} ${timeLeft < 10 ? styles.timerRed : ''}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Tytuł</span>
                                <span className={styles.secretWord} style={{letterSpacing: '3px', whiteSpace: 'pre-wrap'}}>
                                    {hintWord}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.mainCanvas} style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#1a1a1a',
                    color: '#00BFFF',
                    fontSize: '2rem',
                    textAlign: 'center',
                    padding: '20px',
                    border: '2px solid #444'
                }}>
                    {gameActive ? (
                        <div style={{fontStyle: 'italic'}}>
                            "{clueText}"
                        </div>
                    ) : (
                        <div style={{color: '#555'}}>Tu pojawi się fragment piosenki...</div>
                    )}
                </div>
            </div>

            <div className={styles.rightContainer}>
                <ChatComponent className={styles.chatContainer}>
                    {messages.map((data, index) => (
                        <div key={index} className={styles.message}>
                            {data.type === "user-join" ? (
                                <span className={styles.userJoin}>{data.username} dołączył!</span>
                            ) : data.type === "user-left" ? (
                                <span className={styles.userLeft}>{data.username} wyszedł!</span>
                            ) : data.type === "system" ? (
                                <span style={{color: '#FFD700', fontWeight: 'bold'}}>{data.message}</span>
                            ) : (
                                <>
                                    <span className={styles.chatUser}>{data.username}</span>: {data.message}
                                </>
                            )}
                        </div>
                    ))}
                </ChatComponent>
                <div className={styles.underChatContainer}>
                    <div className={styles.inputContainer}>
                        <input ref={inputRef} className={styles.chatInput} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} type={"text"} placeholder={"Zgaduj..."}></input>
                    </div>
                    <AnimatedComponent frames={7} totalWidth={1428} frameHeight={135} widthPercent={50} heightPercent={95} spriteSheet={buttonSprite} timeout={70} onClick = {() => sendMessage()} />
                </div>
            </div>

            <CornerL className={styles.cornerLeft}></CornerL>
            <CornerR className={styles.cornerRight}></CornerR>
        </div>
    )
}

export default GuessSongPage;
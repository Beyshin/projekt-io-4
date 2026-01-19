import { Room } from "../../models/room.js";
import { AddPlayerToRoom, GenerateCode } from "../../services/roomService.js";
import { Player } from "../../models/player.js";
import { sendScoreUpdate } from "./gameHandler.js";

export function CreateRoom(socket, rooms, nicknames) {
    socket.on("create-room", (data) => {
        const nickname = nicknames[socket.id];
        const gameType = data.gameType || 'charades';
        console.log(`User ${nickname} tworzy pokój ${gameType}.`);

        const id = GenerateCode();
        const room = new Room(id, "", [], socket.id, gameType);
        rooms.push(room);

        const player = new Player(socket.id, nickname, 0, id);
        AddPlayerToRoom(room, player);

        socket.join(id);
        socket.emit("room-joined", { roomId: id, ownerId: socket.id, gameType: gameType});
    });
}

export function JoinRoom(socket, rooms, nicknames) {
    socket.on("join-room", async (roomId) => {
        const username = nicknames[socket.id];
        const room = rooms.find((r) => r.id === roomId);

        if (room) {
            const player = new Player(socket.id, username, 0, roomId);
            AddPlayerToRoom(room, player);
            await socket.join(roomId);

            console.log(`${username} dołączył do pokoju ${roomId}`);

            socket.to(roomId).emit("player-joined", { nickname: username });
            socket.emit("room-joined", { roomId: roomId, ownerId: socket.id, gameType: room.gameType });
        } else {
            socket.emit("room-not-found");
        }
    });
}

export function LeaveRoom(socket, rooms, io) {
    const handleLeave = (roomId) => {
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            const player = room.players[playerIndex];
            room.players.splice(playerIndex, 1);

            socket.leave(roomId);
            console.log(`${player.nickname} opuścił pokój ${roomId}`);

            socket.to(roomId).emit("player-left", { nickname: player.nickname });

            if (room.players.length === 0) {
                console.log(`Pokój ${roomId} jest pusty. Usuwanie...`);

                if (room.timerInterval) {
                    clearInterval(room.timerInterval);
                }

                const roomIndex = rooms.indexOf(room);
                if (roomIndex !== -1) {
                    rooms.splice(roomIndex, 1);
                }

                return;
            }


            if (socket.id === room.ownerId) {
                room.ownerId = room.players[0].id;
                console.log(`Nowym właścicielem pokoju ${roomId} jest ${room.players[0].nickname}`);
            }

            if (io) sendScoreUpdate(io, room);
        }


    };

    socket.on("leave-room", (roomId) => handleLeave(roomId));

    socket.on("disconnect", () => {
        const room = rooms.find(r => r.players.some(p => p.id === socket.id));
        if (room) handleLeave(room.id);
    });
}
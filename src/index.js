import express from 'express'; 
import http from 'http';
import {Server} from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  socket.emit('connected', {success: true});

  socket.on("create-room", async (data) => {
    if (!!data?.room && !!data?.username) {
      const sockets = await io.in(data.room).fetchSockets();

      if(sockets.length < 2) {
        socket.join(data.room);

        socket.emit('create-room-res', {success: true, message: 'Tạo phòng thành công'});
      } 
      else {
        socket.emit('create-room-res', {success: false, message: 'Tạo phòng thất bại'});
      }
    }
  });

  socket.on("leave-room", async (data) => {
    if (!!data?.room && !!data?.username) {
      const hasRoom = io.sockets.adapter.rooms.get(data.room);

      if(hasRoom) {
        socket.leave(data.room);
        socket.broadcast.in(data.room).emit('opponent-leave-room-res', {success: true, message: 'Đối thủ đã thoát khỏi phòng'});
      }

      socket.emit('leave-room-res', {success: true, message: 'Đã thoát khỏi phòng'});
    }
  });

  socket.on("join-room", async (data) => {
    if (!!data?.room && !!data?.username) {
      const hasRoom = io.sockets.adapter.rooms.get(data.room);
      const sockets = await io.in(data.room).fetchSockets();

      if(hasRoom) {
        if(sockets.length === 1) {
          socket.join(data.room);
          
          socket.emit('join-room-res', {success: true, message: 'Tham gia phòng thành công', data});
          socket.broadcast.in(data.room).emit('opponent-join-room-res', {success: true, message: 'Đối thủ vừa tham gia phòng thành công', data});
        } else {
          socket.emit('join-room-res', {success: false, message: 'Phòng đã đủ người'});
        }
      } else {
        socket.emit('join-room-res', {success: false, message: 'Phòng không tồn tại'});
      }
    }
  });

  socket.on("ready", async (data) => {
    if (!!data?.room && !!data?.username) {
      const isReady = data?.ready;
      const message = isReady ? 'Đối thủ đã sẵn sàng' : 'Đối thủ huỷ sẵn sàng';

      socket.broadcast.in(data.room).emit('ready-res', {success: true, message, data: isReady})
    }
  });

  socket.on("start", async (data) => {
    if (!!data?.room) {
      socket.emit("start-res", { success: true, message: "Bắt đầu trận đấu" });
      socket.broadcast.in(data.room).emit('start-res', {success: true, message: 'Bắt đầu trận đấu'})
    } else { 
      socket.in(data.room).emit('start-res', {success: false, message: 'Không thể bắt đầu trận đấu'})
    }
  });

  socket.on("select", async (data) => {
    if (!!data?.room && !!data?.username && !!data?.item) {
      socket.broadcast.in(data.room).emit('opponent-select-res', {success: true, message: '', data: data?.item})
    }
  });

  socket.on('disconnect', () => {
    // console.log('user disconnected');
  });

  socket.on("chat", async (data) => {
    if (!!data?.room && !!data?.message) {
      socket.broadcast.in(data.room).emit('chat-res', {success: true, data})
    } 
  });

  socket.on("play-again", async (data) => {
    if (!!data?.room && !!data?.username) {
      socket.broadcast.in(data.room).emit('opponent-play-again-res', {success: true, data})
    } 
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
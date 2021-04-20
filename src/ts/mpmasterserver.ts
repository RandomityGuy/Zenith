import * as udp from 'dgram'
import { BufferReader } from './bufferreader';
import { BufferWriter } from './bufferwriter';
import { Storage } from './storage';

interface MPServer {
    address: string,
    port: number,
    timestamp: number
    info: {
        gameType: string,
        missionType: string,
        maxPlayers: number,
        regionMask: number,
        version: number,
        filterFlag: number,
        botCount: number,
        cpuSpeed: number,
        playerCount: number,
        guidList: number[]
    }
}

// Basically the master server for multiplayer, gives out a list of available servers to the game
export class MPMasterServer {
    socket: udp.Socket
    serverList: MPServer[] = []

    // Starts the Multiplayer Master Server
    initialize() {
        this.socket = udp.createSocket('udp4')

        this.socket.on('message', (msg, rinfo) => this.onMessage(msg, rinfo));
        this.socket.on('error', (err) => this.onError(err));

        let hostsplit = Storage.settings.mpMasterServer.split(':'); // Naive but works for now
        let hostname = hostsplit[0];
        let port = Number.parseInt(hostsplit[1]);

        this.socket.bind(port, hostname);
    }

    // Stops the server
    dispose() {
        this.socket.close();
    }

    // Received on error
    onError(err: Error) {
        console.log(err);
    }

    // Received when someone sends a message
    onMessage(msg: Buffer, rinfo: udp.RemoteInfo) {
        let br = new BufferReader(msg.buffer);

        let cmd = br.readU8();

        console.log(`${cmd} command received`);

        if (cmd === 6) { //MasterServerListRequest

            let queryFlags = br.readU8();
            let key = br.readU32();
            let dummy = br.readU8();
            let gameType = br.readString();
            let missionType = br.readString();
            let minPlayers = br.readU8();
            let maxPlayers = br.readU8();
            let regionMask = br.readU32();
            let version = br.readU32();
            let filterFlag = br.readU8();
            let maxBots = br.readU8();
            let minCPU = br.readU16();
            let buddyCount = br.readU8();

            if (this.serverList.length > 0) {
                let packettotal = this.serverList.length;
                let packetindex = 0;
                this.serverList.forEach(serverinfo => {
                    let serveraddress = serverinfo.address;
                    let serverport = serverinfo.port;

                    let now = new Date().getTime();

                    // Check for refresh
                    if (now > serverinfo.timestamp + 90 * 1000) {

                        // Check if its alive
                        this.socket.send(String.fromCharCode(10), serverport, serveraddress); // GameMasterInfoRequest
                    }

                    let ipbits = serveraddress.split('.');

                    let buf = new BufferWriter();
                    buf.writeUInt8(8); // MasterServerListResponse
                    buf.writeUInt8(0);
                    buf.writeUInt32(key);
                    buf.writeUInt8(packetindex);
                    buf.writeUInt8(packettotal);
                    buf.writeUInt16(packettotal);
                    buf.writeUInt8(Number.parseInt(ipbits[0]));
                    buf.writeUInt8(Number.parseInt(ipbits[1]));
                    buf.writeUInt8(Number.parseInt(ipbits[2]));
                    buf.writeUInt8(Number.parseInt(ipbits[3]));
                    buf.writeUInt16(serverport);

                    packetindex++;

                    let sendbuf = buf.getBuffer();

                    this.socket.send(sendbuf, rinfo.port, rinfo.address);

                })

            } else {
                let buf = new BufferWriter();
                buf.writeUInt8(8); // MasterServerListResponse
                buf.writeUInt8(0);
                buf.writeUInt32(key);
                buf.writeUInt8(0);
                buf.writeUInt8(0);
                buf.writeUInt16(0);
                buf.writeUInt8(0);
                buf.writeUInt8(0);
                buf.writeUInt8(0);
                buf.writeUInt8(0);
                buf.writeUInt16(0);

                let sendbuf = buf.getBuffer();

                this.socket.send(sendbuf, rinfo.port, rinfo.address);
            }
        }

        if (cmd === 12) {
            let flags = br.readU8();
            let key = br.readU32();
            let gameType = br.readString();
            let missionType = br.readString();
            let maxPlayers = br.readU8();
            let regionMask = br.readU32();
            let version = br.readU32();
            let filterFlag = br.readU8();
            let botCount = br.readU8();
            let cpuSpeed = br.readU32();
            let playerCount = br.readU8();
            let guidList = [];
            for (let i = 0; i < playerCount; i++)
                guidList.push(br.readU32());
            
            let info = {
                        gameType: gameType,
                        missionType: missionType,
                        maxPlayers: maxPlayers,
                        regionMask: regionMask,
                        version: version,
                        filterFlag: filterFlag,
                        botCount: botCount,
                        cpuSpeed: cpuSpeed,
                        playerCount: playerCount,
                        guidList: guidList
                    }

            let found = false;
            for (let i = 0; i < this.serverList.length; i++) {
                if (this.serverList[i].address == rinfo.address && this.serverList[i].port == rinfo.port) {
                    this.serverList[i].info = info;
                    this.serverList[i].timestamp = new Date().getTime();
                    found = true;
                    break;
                }
            }

            if (!found) {
                let serverInfo: MPServer = {
                    address: rinfo.address,
                    port: rinfo.port,
                    info: info,
                    timestamp: new Date().getTime()
                }

                this.serverList.push(serverInfo);
            }
        }

        if (cmd === 22) { // GameHeartbeat
            let found = false;
            for (let i = 0; i < this.serverList.length; i++) {
                if (this.serverList[i].address == rinfo.address && this.serverList[i].port == rinfo.port) {
                    this.serverList[i].timestamp = new Date().getTime();
                    found = true;

                    // Get their info
                    this.socket.send(String.fromCharCode(10), rinfo.port, rinfo.address); // GameMasterInfoRequest
                    break;
                }
            }

            if (!found) {
                let serverInfo: MPServer = {
                    address: rinfo.address,
                    port: rinfo.port,
                    info: null,
                    timestamp: new Date().getTime()
                }

                // Get their info
                this.socket.send(String.fromCharCode(10), rinfo.port, rinfo.address); // GameMasterInfoRequest

                this.serverList.push(serverInfo);
            }
        }
    }
}
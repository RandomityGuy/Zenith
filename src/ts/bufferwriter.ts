export class BufferWriter {
    buffers: Buffer[] = [];
    currentBuffer: Buffer;
    offset: number = 0;

    constructor() {
        this.currentBuffer = Buffer.alloc(1024);
        this.buffers.push(this.currentBuffer);
    }

    grow() {
        if (this.offset === 1024) {
            this.offset = 0;
            this.currentBuffer = Buffer.alloc(1024);
            this.buffers.push(this.currentBuffer);
        }
    }

    writeUInt8(value: number) {
        this.grow();
        this.currentBuffer.writeUInt8(value, this.offset);
        this.offset++;
    }

    writeUInt16(value: number) {
        this.grow();
        this.currentBuffer.writeUInt16LE(value, this.offset);
        this.offset += 2;
    }

    writeUInt32(value: number) {
        this.grow();
        this.currentBuffer.writeUInt32LE(value, this.offset);
        this.offset += 4;
    }

    getBuffer() {
        return Buffer.concat(this.buffers);
    }
}
export class BufferReader {
	/** The buffer holding the data. */
	buffer: ArrayBuffer;
	/** The view into the buffer. */
	view: DataView;
	/** The current index of reading. */
	index = 0;

	constructor(arrayBuffer: ArrayBuffer) {
		this.buffer = arrayBuffer;
		this.view = new DataView(arrayBuffer);
	}

	readU8() {
		return this.view.getUint8(this.index++);
	}

	readU16() {
		return this.view.getUint16((this.index = this.index + 2) - 2, true);
	}

	readU32() {
		return this.view.getUint32((this.index = this.index + 4) - 4, true);
	}
	
	readS8() {
		return this.view.getInt8(this.index++);
	}
	
	readS16() {
		return this.view.getInt16((this.index = this.index + 2) - 2, true);
	}

	readS32() {
		return this.view.getInt32((this.index = this.index + 4) - 4, true);
	}

	readF32() {
		return this.view.getFloat32((this.index = this.index + 4) - 4, true);
	}

	readString() {
		// The length of the string is given in the first byte
		let length = this.readU8();
		let result = "";

		for (let i = 0; i < length; i++) {
			result += String.fromCharCode(this.readU8());
		}

		return result;
	}
}
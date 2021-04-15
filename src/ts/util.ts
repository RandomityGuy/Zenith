import * as fs from 'fs-extra'
import * as crypto from 'crypto'
import * as path from 'path'

export class Util {

    // Read a file and generate the valid response data for the file to be sent to PQ
    static responseAsFile(filepath: string) {
        let data = fs.readFileSync(filepath, { encoding: 'binary' });
        
        let md5 = crypto.createHash('md5');
        md5.update(data);
        let hash = md5.digest('hex');

        let base64data = fs.readFileSync(filepath, { encoding: 'base64' });

        let returnvalue = {
            filename: path.basename(filepath),
            contents: [base64data],
            hash: hash
        }
        return returnvalue;
    }
}
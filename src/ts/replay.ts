import * as fs from 'fs-extra'
import * as path from 'path'
import { Util } from './util'

export class Replay {

    // Gets the replay file for a given mission
    static getReplay(missionId: number, type: "Replay" | "Egg") {
        let filepath = path.join(__dirname, 'storage', 'replays', `${missionId}_${type}.rrec`);
        if (fs.existsSync(filepath)) {
            return Util.responseAsFile(filepath);
        } else {
            return {
                error: "Replay not found"
            }
        }
    }

    // Saves the replay for a given mission
    static recordReplay(missionId: number, type: "Replay" | "Egg", data: string) {
        try {
            let filepath = path.join(__dirname, 'storage', 'replays', `${missionId}_${type}.rrec`);
            fs.writeFileSync(filepath, data, { encoding: "base64" });
        } catch {
            return "RETRY";
        }
        return "SUCCESS";
    }
}
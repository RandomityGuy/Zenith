# FILE USED TO UPDATE HASHES IN THE LEADERBOARDS DATABASE

import sqlite3;
import hashlib;
import os;

db =  sqlite3.connect(os.path.join('src','db','leaderboards.db'))

PQDIR = "path to pq";

if (PQDIR == "path to pq"):
    print("input your PQ directory in the file please");
    exit()

cur = db.cursor();

cur.execute("SELECT id, file, name FROM missions;");

missionList = cur.fetchall();

hashlist = {};

for mission in missionList:
    id = mission[0];
    file: str = mission[1];
    name = mission[2];
    filepath = PQDIR + file.replace('/','\\');

    if (".mcs" in filepath):
        filepath += ".dso";

    sha = hashlib.sha256();
    if os.path.isfile(filepath):
        if (".mcs" not in filepath):
            sha.update(file.encode('ascii')); # add the filename, used only for mis
        with open(filepath, "rb") as f:
            sha.update(f.read()); # then the file contents

        newhash = sha.hexdigest();
        newhash = newhash.replace('a','A').replace('b','B').replace('c','C').replace('d','D').replace('e','E').replace('f','F');

        if (newhash not in hashlist):
            print("Regenerated hash for mission", name, "at", filepath, "of", newhash);
            cur.execute("UPDATE missions SET hash=? WHERE id=?;",(newhash,id));
            hashlist[newhash] = file
        else:
            print(f"Mission hash already exists for file {file}");
            print(f"{hashlist[newhash]} already has hash");
            cur.execute("DELETE FROM missions WHERE id=?",(id,));
            cur.execute("DELETE FROM mission_rating_info WHERE mission_id=?",(id,));
    else:
        print("Mission does not exist locally", name, "at", filepath);
        cur.execute("DELETE FROM missions WHERE id=?",(id,));
        cur.execute("DELETE FROM mission_rating_info WHERE mission_id=?",(id,));

cur.close()
db.commit()
db.close()
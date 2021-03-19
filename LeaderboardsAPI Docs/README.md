# PQ Online Leaderboards API
## Common

The following is to be included for all requests and responses.

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| req | int | The request id | Yes | None |
| version | int | The $MP::RevisionOn, as the script says "MP Revision (only updated when changes to MP happen), probably reliable". Its the game internal version | Yes | 10000 |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | pq \<req\> \<buffer\> |

## Endpoints

### Metrics 
./Metrics/RecordGraphicsMetrics.php  

### Marble
./Marble/GetCurrentMarble.php  
./Marble/GetMarbleList.php  
./Marble/RecordMarbleSelection.php  

### Egg:
./Egg/RecordEgg.php  
./Egg/GetEasterEggs.php  

### Achievement
./Achievement/RecordAchievement.php  
./Achievement/GetAchievementList.php  

### Chat
./Chat/GetFlairBitmap.php  

### Server
./Server/CheckPortOpen.php  
./Server/GetServerStatus.php  
./Server/GetServerVersion.php  

### Mission
./Mission/RateMission.php  
./Mission/GetMissionList.php  

### Score
./Score/GetPersonalTopScores.php  
./Score/GetPersonalTopScoreList.php  
./Score/GetGlobalTopScores.php  
./Score/RecordScore.php  
./Score/GetTopScoreModes.php  
./Score/GetGlobalScores.php  

### Replay
./Replay/GetReplay.php  
./Replay/RecordReplay.php  

### Event
./Event/RecordEventTrigger.php  

### Multiplayer
./Multiplayer/RecordMatch.php  
./Multiplayer/VerifyPlayer.php  

### Player
./Player/RecordMetrics.php  
./Player/GetPlayerStats.php   
./Player/GetPlayerAvatar.php  
./Player/CheckLogin.php  
./Player/GetTopPlayers.php  
./Player/GetPlayerAchievements.php  
./Player/RegisterUser.php  
./Player/GetPlayerProfileInfo.php  
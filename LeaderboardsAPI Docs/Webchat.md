# Webchat

The webchat server is a TCP server that is separate from the leaderboards, it handles the chat and other stuff.
It is command based. All commands need to be terminated with "\r\n".  

Command documentation format:  
```
[] : marks an expression.  
\<var\>: marks a variable.  
| : or.  
```

## Outgoing Commands

### Login

The following commands are to be sent to TCP for a login or a relogin when logging in after you lost connection.

if relogin:  
```
RELOGIN
```
endif
```
IDENTIFY [<username> | Guest]
VERIFY <version: game version> <garbledeguck-ed password>
SESSION <session: random 64 chr string>
TRACK <desktop-resolution> <game-resolution> <is-fullscreen> <platform> <use-stencil-shadows> <default-fov> 0 <display-device> <driver-info> <is-fast-mode>
```
for i in 0...GuiCount:
```
GUITRACK <gui[i]> <gui-count[i]>
```
endfor


### Send Chat Message
Used to send a chat message
```
CHAT <destination> <message>
```
destination: can be a username/displayname or empty ""


### Set Mode
Sets the location status such as: "Level Select", "Hosting", "Playing", etc.
```
LOCATION <location>
```

### Ping Test
Does a ping test.
```
PING <data>
```

### Pong Test
Same thing as above.
```
PONG <data>
```

### Add Friend
Adds a user as a friend
```
FRIEND <user>
```

### Remove Friend
Removes a user as friend
```
FRIENDDEL <user>
```

### List Friends
Lists friends
```
FRIENDLIST
```

### Block User
Blocks a user
```
BLOCK <user>
```

### Unlock User
Unlocks a user
```
UNBLOCK <user>
```

### Disconnect
Disconnects from the network
```
DISCONNECT
```

## Incoming Commands

### IDENTIFY <status>
The following are the valid values for status:  
```BANNED <ban-reason: str | null>```: The user is banned.  
```INVALID```: Your credentials are invalid.  
```CHALLENGE```: Retry login.  
```OUTOFDATE```: Update game.  
```SUCCESS```: Identification successful.  

### INFO <data>
The following are the valid values for data:  
```LOGGING```: Does nothing.  
```ACCESS <access-level: int>```: The access level of the account.  
```DISPLAY <display-name: str>```: The display name of the user.  
```CURRATING <rating: int>```: The total rating of the user.  
```WELCOME <welcome-message: str>```: The webchat welcome message.  
```DEFAULT <name: str>```: The default highscore name.  
```ADDRESS <ip: str>```: The ip address.  
```HELP [INFO | CMDLIST] <str>```: The help info/cmdlist output.  
```USERNAME <name: str>```: The username of the user.  
```CANCHAT <chat: bool>```: Enables/disables chat.

### LOGGED 
Returned when successfully login happens.

### ACCEPTTOS
Returned when the TOS is accepted.


### FRIEND <data>
The following are valid values for data:
```START```: Marks the beginning for friend list.  
```NAME <username: str> <displayname: str>```: The friend username and display name.  
```DONE```: Marks the end of the friend list.  
```ADDED```: Returned when a friend is successfully added.  
```DELETED```: Returned when a friend is successfully removed.  
```FAILED```: Returned when an operation fails.  

### BLOCK <data>
The following are valid values for data:
```START```: Marks the beginning for block list.  
```NAME <username: str> <displayname: str>```: The blocked username and display name.  
```DONE```: Marks the end of the block list.  
```ADDED```: Returned when a user is successfully blocked.  
```DELETED```: Returned when a user is successfully unblocked.  
```FAILED```: Returned when an operation fails.  

### FLAIR <flair-id: str>
The flair for the user.  

### WINTER
Sets the game theme to winterfest.  

### 2SPOOKY
Sets the game theme to frightfest.  

### USER <data>
The following are valid values for data:  
```START```: Marks the start of user data.  
```INFO <username:str > <access: int> <location: int> <display: str> <color: hex> <flair: str> <prefix: str> <suffix: str>```: The user data.  
```DONE```: Marks the end of user data.  

### CHAT <username: str> <displayname: str> <destination: str> <access: int> <message: str>
Received when a player chats, parameters are self explanatory.  

### NOTIFY <type: str> <username: str> <displayname: str> <data>
The following are valid values for type:  
```login```: Received when \<username\> logs in.  
```logout```: Received when \<username\> logs out.  
```setlocation```: Received when \<username\> sets their status to \<data\>.  
```kick```: Received when \<username\> is kicked. If it was you, then the reason may be in \<data\>.  
```levelup```: Received when \<username\> levels up in Fubar.  
```mastery```: Received when \<username\> gains a Mastery Point in Fubar.  
```taskcomplete```: Received when \<username\> completes a task in \<data\> in Fubar.  
```achievement```: Received when \<username\> gets an achievement.  
```prestigeup```: Received when \<username\> gains a Prestige rank in Fubar.  
```record```: Received when \<username\> achieves a world record on \<data[0]: level> of time \<data[1]: time>.  
```recordscore```: Received when \<username\> achieves a world record on \<data[0]: level> of score \<data[1]: score>.  

### SHUTDOWN
Received when server is about to shut down.  

### PING <data>
Received when pinging, send this back as pong.  

### PONG <data>
Received after pong is received by the server.  

### PINGTIME <time: int>
Gets the ping time.  

### STATUS <id: int> <text: str>
Maps status \<text\> to \<id\>.  

### COLOR <id: int> <color: hex>
Maps color \<color\> to \<id\>.  
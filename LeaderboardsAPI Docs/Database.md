## Database Structure

Below are the necessary tables required for a functioning leaderboards.

### Achievement Categories: achievement_categories

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY NOT NULL auto_increment | NULL | The id |
| title | text | None | NULL | The title of the category |
| bitmap_path | text | None | NULL | The path where the achievement bitmaps are stored |


### Achievement Names: achievement_names

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY NOT NULL auto_increment | NULL | The id |
| category_id | int | auto_increment | 1 | The category id for the achievement |
| index | int | None | NULL | The order of the achievement |
| title | int | None | NULL | The title of the achievement |
| description | int | None | NULL | The description of the achievement |
| rating | int | None | 0 | The rating given by the achievement |
| reward_flair | int | None | NULL | The flair given by completing the achievement |
| mask | tinyint(1) | None | 0 | None |
| manual | tinyint(1) | None | 0 | None |
| bitmap_extent | varchar(8) | None | 113 44 | The bitmap extent used by the game for rendering |

### Marbles: marbles

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The marble id |
| category_id | int | None | None | The marble category id |
| name | text | None | None | The marble name |
| shape_file | text | None | None | The path to the marble dts shape |
| skin | text | None | None | The marble skin |
| shaderV | text | None | None | The vertex shader path |
| shaderF | text | None | None | The fragment shader path |
| sort | int | None | None | The order of the marble, used for sorting |
| disabled | tinyint(1) | None | 0 | Whether the marble is disabled |

### Match Scores: match_scores

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The score id |
| match_id | int | None | None | The id of the match this score belongs to |
| user_id | int | None | None | The id of the user who achieved the score |
| score_id | int | None | None | The score id..again |
| team_id | int | None | None | The id of the team this score belongs to |
| placement | int | None | 1 | The rank of the score in the match |
| time_percent | float | None | 1 | Percentage of time the user was connected throughout the match |

### Match Teams: match_teams

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The team id |
| match_id | int | None | None | The id of the match on which a team game was played |
| name | text | None | None | The team name |
| color | int | None | None | The team color |
| player_count | int | None | 0 | The player count of the team |

### Matches: matches

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The match id |
| mission_id | int | None | None | The id of the mission this match was played on |
| player_count | int | None | None | The player count of the match |
| team_count | int | None | 0 | The team count of the match |
| rating_multiplier | float | None | 1 | The ratings multiplier |
| server_address | text | None | None | The server ip this match was hosted on |
| server_port | int | None | None | The server port this match was hosted on |
| dedicated | tinyint(1) | None | 0 | Whether the match was on a dedicated server or not |

### Mission Difficulties: mission_difficulties

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The id of the difficulty |
| game_id | int | None | None | The id of the game this difficulty belongs to |
| name | text | None | None | The name of the difficulty |
| display | text | None | None | The display text of the difficulty |
| sort_index | int | None | None | Index, used for sorting |
| directory | text | None | None | The path to the mis files of the difficulty |
| bitmap_directory | text | None | None | The path to the directory with the bitmaps |
| previews_directory | text | None | None | The path to the previews directory |
| is_local | tinyint(1) | None | 0 | Whether the difficulty is local |
| disabled | tinyint(1) | None | 0 | Whether the difficulty is disabled |

### Mission Games: mission_games

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The id of the game |
| name | text | None | None | The name of the game |
| display | text | None | None | The display text of the game |
| sort_index | int | None | None | The sort index |
| long_display | text | None | None | The full display name |
| rating_column | text | None | None | The rating column used |
| game_type | enum('Single Player','Multiplayer') | None | Single Player | The type of the game |
| has_platinum_times | tinyint(1) | None | 1 | Whether the game has Platinum Times |
| has_ultimate_times | tinyint(1) | None | 1 | Whether the game has Ultimate Times |
| has_awesome_times | tinyint(1) | None | 0 | Whether the game has ATs  |
| has_easter_eggs | tinyint(1) | None | 1 | Whether the game has EEs |
| platinum_time_name | text | None | None | The display text of the Platinum Time |
| ultimate_time_name | text | None | None | The display text of the Ultimate Time |
| awesome_time_name | text | None | None | The display text of the Awesome Time |
| easter_egg_name | text | None | None | The display text of the Easter Egg |
| platinum_time_count | int | None | 0 | Number of Platinum Times |
| ultimate_time_count | int | None | 0 | Number of Ultimate Times |
| awesome_time_count | int | None | 0 | Number of Awesome Time |
| egg_count | int | None | 0 | Number of Easter Egg |
| force_gamemode | text | None | None | The default gamemode |
| has_blast | tinyint(1) | None | 1 | Whether the game has blast |
| disabled | tinyint(1) | None | 0 | Whether the game is disabled |

### Mission Rating Info: mission_rating_info

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| mission_id | int | PRIMARY KEY  NOT NULL  | None | The id of the mission this info is bound with |
| par_time | int | None | 0 | The par time of the mission |
| platinum_time | int | None | 0 | The platinum time of the mission |
| ultimate_time | int | None | 0 | The ultimate time of the mission |
| awesome_time | int | None | 0 | The awesome time of the mission |
| par_score | int | None | 0 | The par score of the mission |
| platinum_score | int | None | 0 | The platinum score of the mission |
| ultimate_score | int | None | 0 | The ultimate score of the mission |
| awesome_score | int | None | 0 | The awesome score of the mission |
| versus_par_score | int | None | 0 | The versus par score of the mission |
| versus_platinum_score | int | None | 0 | The versus platinum score of the mission |
| versus_ultimate_score | int | None | 0 | The versus ultimate score of the mission |
| versus_awesome_score | int | None | 0 | The versus awesome score of the mission |
| completion_bonus | int | None | 0 | Rating calculation constant |
| set_base_score | int | None | 0 | Rating calculation constant |
| multiplier_set_base | float | None | 0 | Rating calculation constant |
| platinum_bonus | int | None | 0 | Rating calculation constant |
| ultimate_bonus | int | None | 0 | Rating calculation constant |
| awesome_bonus | int | None | 0 | Rating calculation constant |
| standardiser | int | None | 0 | Rating calculation constant |
| time_offset | int | None | 100 | Rating calculation constant |
| difficulty | float | None | 1 | Rating calculation constant |
| platinum_difficulty | float | None | 1 | Rating calculation constant |
| ultimate_difficulty | float | None | 1 | Rating calculation constant |
| awesome_difficulty | float | None | 1 | Rating calculation constant |
| hunt_multiplier | int | None | 0 | Rating calculation constant |
| hunt_divisor | int | None | 0 | Rating calculation constant |
| hunt_completion_bonus | int | None | 1 | Rating calculation constant |
| hunt_par_bonus | int | None | 0 | Rating calculation constant |
| hunt_platinum_bonus | int | None | 0 | Rating calculation constant |
| hunt_ultimate_bonus | int | None | 0 | Rating calculation constant |
| hunt_awesome_bonus | int | None | 0 | Rating calculation constant |
| hunt_max_score | int | None | 0 | Rating calculation constant |
| quota_100_bonus | int | None | 0 | Rating calculation constant |
| gem_count | int | None | 0 | Number of gems in the mission |
| gem_count_1 | int | None | 0 | Numberof red gems in the mission |
| gem_count_2 | int | None | 0 | Number of yellow gems in the mission |
| gem_count_5 | int | None | 0 | Number of blue gems in the mission |
| gem_count_10 | int | None | 0 | Number of platinum gems in the mission |
| has_egg | tinyint(1) | None | 0 | Whether the mission has egg |
| egg_rating | int | None | 0 | Rating calculation constant |
| disabled | tinyint(1) | None | 0 | Whether the mission is disabled |
| normally_hidden | tinyint(1) | NOT NULL  | 0 | Whether the mission is normally hidden |
| notes | text | None | None | Mission notes |

### Missions: missions

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The mission id |
| game_id | int | NOT NULL  | None | The id of the game this mission belongs to |
| difficulty_id | int | NOT NULL  | None | The id of the difficulty this mission belongs to |
| file | text | None | None | The path to the mis file |
| basename | text | NOT NULL  | None | The internal name |
| name | text | NOT NULL  | None | The name of the mission |
| gamemode | text | NOT NULL  | None | The gamemode of the mission |
| sort_index | int | None | 1 | The sort index |
| is_custom | tinyint(1) | None | 0 | Whether the mission is custom |
| hash | varchar(64) | None | None | The hash of the mission |
| modification | text | None | None | The modification this mission belongs to |

### Settings: settings

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The settings id |
| key | text | None | None | The property key |
| value | text | None | None | The property value |

### User Achievements: user_achievements

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The id |
| user_id | int | None | None | Id of the user who obtained the achievement |
| achievement_id | int | None | None | The id of the achievement that was obtained |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | When the achievement was obtained |

### User Current Marble Selection: user_current_marble_selection

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The id of the marble selection |
| user_id | int | NOT NULL  | 0 | The user id |
| marble_id | int | NOT NULL  | 0 | The id of the marble selected by the user |

### User Eggs: user_eggs

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The egg score id |
| user_id | int | NOT NULL  | 0 | The id of the user who got the egg |
| mission_id | int | NOT NULL  | 0 | The mission on which the egg was obtained |
| time | int | None | None | The egg score |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | When the score was obtained |

### User Event Snowballs: user_event_snowballs

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| score_id | int | PRIMARY KEY  NOT NULL  | None | The id of the score |
| snowballs | int | None | 0 | Number of thrown snowballs |
| hits | int | None | 0 | Number of snowballs that hit |

### User Event Triggers: user_event_triggers

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| user_id | int | PRIMARY KEY  NOT NULL  | None | The id of the user who triggerred the trigger |
| trigger | int | PRIMARY KEY  NOT NULL  | None | The id of the trigger that was triggerred |
| timestamp | timestamp | DEFAULT_GENERATED| CURRENT_TIMESTAMP | When the trigger was triggerred |

### User Lap Times: user_lap_times

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The lap time id |
| mission_id | int | None | None | The id of the mission this time was obtained on |
| user_id | int | None | None | The id of the user who achieved this time |
| time | int | None | 5999999 | The lap time |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | When the time was achieved |

### User Ratings: user_ratings

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| user_id | int | PRIMARY KEY  NOT NULL  | None | The id of the user |
| rating_general | int | None | 0 | The general rating of the user |
| rating_mbg | int | None | 0 | The mbg rating of the user |
| rating_mbp | int | None | 0 | The mbp rating of the user |
| rating_mbu | int | None | 0 | The mbu rating of the user |
| rating_pq | int | None | 0 | The pq rating of the user |
| rating_custom | int | None | 0 | The customs rating of the user |
| rating_egg | int | None | 0 | The egg rating of the user |
| rating_quota_bonus | int | None | 0 | The quota bonus rating of the user |
| rating_achievement | int | None | 0 | The achievement rating of the user |
| rating_mp | int | None | 0 | The multiplayer rating of the user |

### User Scores: user_scores

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | The score id |
| user_id | int | NOT NULL  | 0 | The id of the user who got the score |
| mission_id | int | NOT NULL  | 0 | The id of the mission the score was obtained on |
| score | int | None | None | The score |
| score_type | enum('time','score') | NOT NULL  | time | The type of the score |
| total_bonus | int | None | None | The time travel bonus |
| rating | int | None | 0 | The rating of the score |
| gem_count | int | None | None | Number of gems collected |
| gems_1_point | int | None | 0 | Number of red gems collected |
| gems_2_point | int | None | 0 | Number of yellow gems collected |
| gems_5_point | int | None | 0 | Number of blue gems collected |
| gems_10_point | int | None | 0 | Number of platinum gems collected |
| modifiers | int | None | 0 | The modifiers of the score |
| origin | enum('PhilsEmpire','MarbleBlast.com','MarbleBlastPlatinum','PlatinumQuest','Ratings Viewer','External') | None | PlatinumQuest | Where the score originated from |
| extra_modes | text | None | None | The extra modes of the score |
| sort | int | None | 0 | The sort index |
| disabled | tinyint(1) | NOT NULL  | 0 | Whether the score is disabled |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | The timestamp of when the score was obtained |

### User Streaks: user_streaks

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| user_id | int | PRIMARY KEY  NOT NULL  | None | The user id |
| mp_games | int | None | 0 | The number of consecutive matches won |